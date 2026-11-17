import 'server-only';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { parseBlogSchema, type BlogSchema } from './structured-data/schema';

export interface BlogTermRef {
  name: string;
  slug: string;
}

export interface BlogCard {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  published_at: string | null;
  created_at: string | null;
  reading_minutes: number;
  blog_categories: BlogTermRef | null;
}

export interface BlogDetail extends BlogCard {
  html: string;
  coverAlt: string | null;
  tags: BlogTermRef[];
  authorName: string | null;
  seo_title: string | null;
  seo_description: string | null;
  updated_at: string | null;
  schema: BlogSchema;
}

export interface BlogNav {
  categories: BlogTermRef[];
  tags: BlogTermRef[];
}

export interface PostQuery {
  limit: number;
  offset?: number;
  categorySlug?: string;
  tagSlug?: string;
  search?: string;
  featuredOnly?: boolean;
  excludeIds?: string[];
}

export interface PostPage {
  items: BlogCard[];
  total: number;
}

const CARD_COLUMNS =
  'id, title, slug, excerpt, cover_image_url, published_at, created_at, reading_minutes, category:blog_categories(name, slug)';

function toCard(row: any): BlogCard {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? null,
    featured_image: row.cover_image_url ?? null,
    published_at: row.published_at ?? null,
    created_at: row.created_at ?? null,
    reading_minutes: row.reading_minutes ?? 1,
    blog_categories: row.category ? { name: row.category.name, slug: row.category.slug } : null,
  };
}

async function termId(table: 'blog_categories' | 'blog_tags', slug: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from(table).select('id').eq('slug', slug).maybeSingle();
  return (data?.id as string) ?? null;
}

async function postIdsWithTag(tagId: string): Promise<string[]> {
  const { data } = await supabaseAdmin.from('blog_post_tags').select('post_id').eq('tag_id', tagId);
  return (data ?? []).map((r) => r.post_id as string);
}

export async function countPublishedPosts(): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published');
  if (error) throw error;
  return count ?? 0;
}

export async function findPublishedPosts(q: PostQuery): Promise<PostPage> {
  const offset = q.offset ?? 0;
  let query = supabaseAdmin
    .from('blog_posts')
    .select(CARD_COLUMNS, { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + q.limit - 1);

  if (q.categorySlug) {
    const id = await termId('blog_categories', q.categorySlug);
    if (!id) return { items: [], total: 0 };
    query = query.eq('category_id', id);
  }
  if (q.tagSlug) {
    const id = await termId('blog_tags', q.tagSlug);
    const ids = id ? await postIdsWithTag(id) : [];
    if (ids.length === 0) return { items: [], total: 0 };
    query = query.in('id', ids);
  }
  if (q.search) query = query.or(`title.ilike.%${q.search.replace(/[%_,()]/g, ' ')}%,excerpt.ilike.%${q.search.replace(/[%_,()]/g, ' ')}%`);
  if (q.featuredOnly) query = query.eq('is_featured', true);
  if (q.excludeIds?.length) query = query.not('id', 'in', `(${q.excludeIds.join(',')})`);

  const { data, error, count } = await query;
  if (error) throw error;
  return { items: (data ?? []).map(toCard), total: count ?? 0 };
}

export async function findPublishedPost(slug: string): Promise<BlogDetail | null> {
  const { data, error } = await supabaseAdmin
    .from('blog_posts')
    .select(
      `${CARD_COLUMNS}, content_html, cover_image_alt, seo_title, seo_description, structured_data, updated_at, created_by, blog_post_tags(tag:blog_tags(name, slug))`,
    )
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const row = data as any;
  let authorName: string | null = null;
  if (row.created_by) {
    const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('id', row.created_by).maybeSingle();
    authorName = (profile?.full_name as string) || null;
  }

  return {
    ...toCard(row),
    html: row.content_html ?? '',
    coverAlt: row.cover_image_alt ?? null,
    tags: (row.blog_post_tags ?? []).map((t: any) => t?.tag).filter(Boolean),
    authorName,
    seo_title: row.seo_title ?? null,
    seo_description: row.seo_description ?? null,
    updated_at: row.updated_at ?? null,
    schema: parseBlogSchema(row.structured_data),
  };
}

export async function findTermBySlug(kind: 'categories' | 'tags', slug: string): Promise<BlogTermRef | null> {
  const table = kind === 'categories' ? 'blog_categories' : 'blog_tags';
  const { data } = await supabaseAdmin.from(table).select('name, slug').eq('slug', slug).maybeSingle();
  return data ? { name: data.name as string, slug: data.slug as string } : null;
}

export async function findBlogNav(): Promise<BlogNav> {
  const { data: posts, error } = await supabaseAdmin
    .from('blog_posts')
    .select('id, category_id')
    .eq('status', 'published');
  if (error) throw error;

  const postIds = (posts ?? []).map((p) => p.id as string);
  const categoryIds = [...new Set((posts ?? []).map((p) => p.category_id as string | null).filter(Boolean))] as string[];
  const { data: tagLinks } = postIds.length
    ? await supabaseAdmin.from('blog_post_tags').select('tag_id').in('post_id', postIds)
    : { data: [] };
  const tagIds = [...new Set((tagLinks ?? []).map((t) => t.tag_id as string))];

  const [categories, tags] = await Promise.all([
    categoryIds.length ? supabaseAdmin.from('blog_categories').select('name, slug').in('id', categoryIds).order('name') : { data: [] },
    tagIds.length ? supabaseAdmin.from('blog_tags').select('name, slug').in('id', tagIds).order('name') : { data: [] },
  ]);

  return {
    categories: (categories.data ?? []) as BlogTermRef[],
    tags: (tags.data ?? []) as BlogTermRef[],
  };
}
