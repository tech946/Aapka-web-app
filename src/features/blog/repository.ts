import 'server-only';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { fromDbError, notFound } from '@/lib/api/errors';
import { TAXONOMY_META, type BlogStatus, type TaxonomyKind } from './constants';
import type { BlogListQuery, BlogTermInput } from './schemas';
import { parseBlogSchema, type BlogSchema } from './structured-data/schema';
import type { BlogPost, BlogPostSummary, BlogTerm, Paginated } from './types';

const POSTS = 'blog_posts';
const POST_TAGS = 'blog_post_tags';

export interface PostRecord {
  title: string;
  slug: string;
  excerpt: string | null;
  content_html: string;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  category_id: string | null;
  status: BlogStatus;
  is_featured: boolean;
  reading_minutes: number;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  structured_data: BlogSchema;
}

interface PostRow extends PostRecord {
  id: string;
  created_at: string;
  updated_at: string;
  blog_post_tags?: { tag_id: string }[];
}

function toPost(row: PostRow): BlogPost {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? '',
    contentHtml: row.content_html ?? '',
    coverImageUrl: row.cover_image_url ?? '',
    coverImageAlt: row.cover_image_alt ?? '',
    categoryId: row.category_id,
    tagIds: (row.blog_post_tags ?? []).map((t) => t.tag_id),
    status: row.status,
    isFeatured: row.is_featured,
    seoTitle: row.seo_title ?? '',
    seoDescription: row.seo_description ?? '',
    schema: parseBlogSchema(row.structured_data),
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function authorNames(userIds: string[]): Promise<Map<string, string>> {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) return new Map();
  const { data } = await supabaseAdmin.from('profiles').select('id, full_name, email_address').in('id', ids);
  return new Map((data ?? []).map((p) => [p.id as string, (p.full_name || p.email_address || '') as string]));
}

export async function findPosts(query: BlogListQuery): Promise<Paginated<BlogPostSummary>> {
  const from = (query.page - 1) * query.pageSize;
  let q = supabaseAdmin
    .from(POSTS)
    .select('id, title, slug, status, cover_image_url, published_at, updated_at, created_by, category:blog_categories(id, name)', {
      count: 'exact',
    })
    .order('updated_at', { ascending: false })
    .range(from, from + query.pageSize - 1);

  if (query.search) q = q.ilike('title', `%${query.search.replace(/[%_]/g, '\\$&')}%`);
  if (query.status) q = q.eq('status', query.status);
  if (query.categoryId) q = q.eq('category_id', query.categoryId);

  const { data, error, count } = await q;
  if (error) throw fromDbError(error);

  const rows = (data ?? []) as any[];
  const names = await authorNames(rows.map((r) => r.created_by));

  return {
    items: rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      status: r.status,
      coverImageUrl: r.cover_image_url,
      category: r.category ? { id: r.category.id, name: r.category.name } : null,
      authorName: names.get(r.created_by) || null,
      publishedAt: r.published_at,
      updatedAt: r.updated_at,
    })),
    total: count ?? 0,
    page: query.page,
    pageSize: query.pageSize,
  };
}

export async function findPostById(id: string): Promise<BlogPost> {
  const { data, error } = await supabaseAdmin.from(POSTS).select('*, blog_post_tags(tag_id)').eq('id', id).maybeSingle();
  if (error) throw fromDbError(error);
  if (!data) throw notFound('Post not found.');
  return toPost(data as PostRow);
}

export async function slugsStartingWith(base: string, excludeId?: string): Promise<string[]> {
  let q = supabaseAdmin.from(POSTS).select('slug').like('slug', `${base}%`);
  if (excludeId) q = q.neq('id', excludeId);
  const { data, error } = await q;
  if (error) throw fromDbError(error);
  return (data ?? []).map((r) => r.slug as string);
}

export async function insertPost(record: PostRecord, userId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from(POSTS)
    .insert({ ...record, created_by: userId, updated_by: userId })
    .select('id')
    .single();
  if (error) throw fromDbError(error, 'A post with this slug already exists.');
  return data.id as string;
}

export async function updatePost(id: string, record: PostRecord, userId: string): Promise<void> {
  const { error } = await supabaseAdmin.from(POSTS).update({ ...record, updated_by: userId }).eq('id', id);
  if (error) throw fromDbError(error, 'A post with this slug already exists.');
}

export async function replacePostTags(postId: string, tagIds: string[]): Promise<void> {
  const { error: clearError } = await supabaseAdmin.from(POST_TAGS).delete().eq('post_id', postId);
  if (clearError) throw fromDbError(clearError);
  if (tagIds.length === 0) return;
  const { error } = await supabaseAdmin.from(POST_TAGS).insert([...new Set(tagIds)].map((tag_id) => ({ post_id: postId, tag_id })));
  if (error) throw fromDbError(error);
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabaseAdmin.from(POSTS).delete().eq('id', id);
  if (error) throw fromDbError(error);
}

async function termUsage(kind: TaxonomyKind): Promise<Map<string, number>> {
  const { data } =
    kind === 'categories'
      ? await supabaseAdmin.from(POSTS).select('term:category_id').not('category_id', 'is', null)
      : await supabaseAdmin.from(POST_TAGS).select('term:tag_id');
  const counts = new Map<string, number>();
  for (const row of (data ?? []) as { term: string }[]) counts.set(row.term, (counts.get(row.term) ?? 0) + 1);
  return counts;
}

export async function findTerms(kind: TaxonomyKind): Promise<BlogTerm[]> {
  const [{ data, error }, usage] = await Promise.all([
    supabaseAdmin.from(TAXONOMY_META[kind].table).select('id, name, slug, description').order('name'),
    termUsage(kind),
  ]);
  if (error) throw fromDbError(error);
  return (data ?? []).map((t) => ({ ...(t as Omit<BlogTerm, 'postCount'>), postCount: usage.get(t.id as string) ?? 0 }));
}

export async function insertTerm(kind: TaxonomyKind, input: Required<BlogTermInput>): Promise<BlogTerm> {
  const { data, error } = await supabaseAdmin
    .from(TAXONOMY_META[kind].table)
    .insert({ name: input.name, slug: input.slug, description: input.description || null })
    .select('id, name, slug, description')
    .single();
  if (error) throw fromDbError(error, `A ${TAXONOMY_META[kind].singular.toLowerCase()} with this slug already exists.`);
  return { ...(data as Omit<BlogTerm, 'postCount'>), postCount: 0 };
}

export async function updateTerm(kind: TaxonomyKind, id: string, input: Required<BlogTermInput>): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from(TAXONOMY_META[kind].table)
    .update({ name: input.name, slug: input.slug, description: input.description || null })
    .eq('id', id)
    .select('id');
  if (error) throw fromDbError(error, `A ${TAXONOMY_META[kind].singular.toLowerCase()} with this slug already exists.`);
  if (!data?.length) throw notFound();
}

export async function deleteTerm(kind: TaxonomyKind, id: string): Promise<void> {
  const { error } = await supabaseAdmin.from(TAXONOMY_META[kind].table).delete().eq('id', id);
  if (error) throw fromDbError(error);
}
