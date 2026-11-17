import 'server-only';
import { cache } from 'react';
import {
  countPublishedPosts,
  findBlogNav,
  findPublishedPost,
  findPublishedPosts,
  findTermBySlug,
  type BlogCard,
  type BlogDetail,
  type BlogNav,
  type BlogTermRef,
} from '@/features/blog/public';
import { FALLBACK_NAV, fallbackPost, fallbackPosts, fallbackTerm } from '@/features/blog/fallback';

export type { BlogCard, BlogDetail, BlogNav, BlogTermRef };

export type BlogTermKind = 'categories' | 'tags';

export interface BlogListingQuery {
  categorySlug?: string;
  tagSlug?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface BlogListing {
  items: BlogCard[];
  total: number;
  page: number;
  pageSize: number;
}

const FEATURED_LIMIT = 5;
const RECENT_LIMIT = 10;
const MAX_LIMIT = 100;

const usingLivePosts = cache(async (): Promise<boolean> => {
  try {
    return (await countPublishedPosts()) > 0;
  } catch (e) {
    console.error('[blog-source] count failed, showing sample posts', e);
    return false;
  }
});

async function safely<T>(label: string, run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (e) {
    console.error(`[blog-source] ${label} failed`, e);
    return fallback;
  }
}

export async function listBlogs({ limit = 50, categorySlug = '' }: { limit?: number; categorySlug?: string } = {}): Promise<BlogCard[]> {
  const safeLimit = Math.min(Math.max(1, Math.floor(limit) || 1), MAX_LIMIT);
  if (!(await usingLivePosts())) return fallbackPosts({ categorySlug }).slice(0, safeLimit);
  return safely('listBlogs', async () => (await findPublishedPosts({ limit: safeLimit, categorySlug })).items, []);
}

export const getBlogHome = cache(async (): Promise<{ featured: BlogCard[]; recent: BlogCard[] }> => {
  if (!(await usingLivePosts())) {
    const featured = fallbackPosts({ featuredOnly: true });
    const ids = new Set(featured.map((p) => p.id));
    return { featured, recent: fallbackPosts().filter((p) => !ids.has(p.id)) };
  }

  return safely(
    'getBlogHome',
    async () => {
      const flagged = (await findPublishedPosts({ limit: FEATURED_LIMIT, featuredOnly: true })).items;
      const featured = flagged.length ? flagged : (await findPublishedPosts({ limit: 3 })).items;
      const rest = (await findPublishedPosts({ limit: RECENT_LIMIT, excludeIds: featured.map((p) => p.id) })).items;
      const recent = rest.length ? rest : (await findPublishedPosts({ limit: RECENT_LIMIT })).items;
      return { featured, recent };
    },
    { featured: [], recent: [] },
  );
});

export async function getBlogListing({ categorySlug, tagSlug, search, page = 1, pageSize = 12 }: BlogListingQuery): Promise<BlogListing> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const offset = (safePage - 1) * pageSize;

  if (!(await usingLivePosts())) {
    const all = fallbackPosts({ categorySlug, tagSlug, search });
    return { items: all.slice(offset, offset + pageSize), total: all.length, page: safePage, pageSize };
  }

  const result = await safely(
    'getBlogListing',
    () => findPublishedPosts({ limit: pageSize, offset, categorySlug, tagSlug, search }),
    { items: [], total: 0 },
  );
  return { ...result, page: safePage, pageSize };
}

export const getBlog = cache(async (slug: string): Promise<BlogDetail | null> => {
  if (!slug) return null;
  if (!(await usingLivePosts())) return fallbackPost(slug);
  return safely('getBlog', () => findPublishedPost(slug), null);
});

export const getBlogTerm = cache(async (kind: BlogTermKind, slug: string): Promise<BlogTermRef | null> => {
  if (!slug) return null;
  if (!(await usingLivePosts())) return fallbackTerm(kind, slug);
  return safely('getBlogTerm', () => findTermBySlug(kind, slug), null);
});

export const getBlogNav = cache(async (): Promise<BlogNav> => {
  if (!(await usingLivePosts())) return FALLBACK_NAV;
  return safely('getBlogNav', findBlogNav, { categories: [], tags: [] });
});

export async function getRelatedBlogs(current: BlogCard | null, limit = 6): Promise<BlogCard[]> {
  const latest = await listBlogs({ limit: limit + 1 });
  if (!current) return latest.slice(0, limit);

  const sameCategory = current.blog_categories ? await listBlogs({ limit: limit + 1, categorySlug: current.blog_categories.slug }) : [];
  const seen = new Set([current.id]);
  const out: BlogCard[] = [];
  for (const post of [...sameCategory, ...latest]) {
    if (seen.has(post.id)) continue;
    seen.add(post.id);
    out.push(post);
    if (out.length === limit) break;
  }
  return out;
}
