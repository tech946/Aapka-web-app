import 'server-only';
import { revalidatePath } from 'next/cache';
import { PERMISSIONS, hasPermission } from '@/lib/access';
import type { AccessUser } from '@/lib/access/server';
import { badRequest, forbidden } from '@/lib/api/errors';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { slugify } from '@/lib/slug';
import { readingMinutes } from './reading-time';
import * as repo from './repository';
import type { TaxonomyKind } from './constants';
import type { BlogPostInput, BlogTermInput } from './schemas';
import type { BlogPost } from './types';

const RESERVED_SLUGS = new Set(['all', 'search', 'category', 'tag']);

function canPublish(user: AccessUser): boolean {
  return hasPermission(user.permissions, PERMISSIONS.BLOG_PUBLISH);
}

async function uniqueSlug(wanted: string, title: string, excludeId?: string): Promise<string> {
  const slug = slugify(wanted || title);
  if (!slug) throw badRequest('Add a title or slug with letters or numbers.');
  const base = RESERVED_SLUGS.has(slug) ? `${slug}-post` : slug;
  const taken = new Set(await repo.slugsStartingWith(base, excludeId));
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

function toRecord(input: BlogPostInput, slug: string, publishedAt: string | null): repo.PostRecord {
  const html = sanitizeHtml(input.contentHtml);
  return {
    title: input.title,
    slug,
    excerpt: input.excerpt || null,
    content_html: html,
    cover_image_url: input.coverImageUrl || null,
    cover_image_alt: input.coverImageAlt || null,
    category_id: input.categoryId,
    status: input.status,
    is_featured: input.isFeatured,
    reading_minutes: readingMinutes(html),
    published_at: publishedAt,
    seo_title: input.seoTitle || null,
    seo_description: input.seoDescription || null,
    structured_data: input.schema,
  };
}

function revalidatePublicBlog(...slugs: string[]): void {
  revalidatePath('/');
  revalidatePath('/blogs');
  revalidatePath('/blogs/category/[slug]', 'page');
  for (const slug of new Set(slugs)) revalidatePath(`/blogs/${slug}`);
}

export const listPosts = repo.findPosts;
export const getPost = repo.findPostById;

export async function createPost(input: BlogPostInput, user: AccessUser): Promise<BlogPost> {
  if (input.status === 'published' && !canPublish(user)) {
    throw forbidden('Only a DM Admin can publish. Save it as a draft instead.');
  }
  const slug = await uniqueSlug(input.slug, input.title);
  const publishedAt = input.status === 'published' ? new Date().toISOString() : null;
  const id = await repo.insertPost(toRecord(input, slug, publishedAt), user.id);
  await repo.replacePostTags(id, input.tagIds);

  if (input.status === 'published') revalidatePublicBlog(slug);
  return repo.findPostById(id);
}

export async function updatePost(id: string, input: BlogPostInput, user: AccessUser): Promise<BlogPost> {
  const existing = await repo.findPostById(id);
  const touchesLive = existing.status === 'published' || input.status === 'published';
  if (touchesLive && !canPublish(user)) {
    throw forbidden('This post is live (or would go live). Only a DM Admin can change it.');
  }

  const slug = await uniqueSlug(input.slug || existing.slug, input.title, id);
  const publishedAt = input.status === 'published' ? existing.publishedAt ?? new Date().toISOString() : existing.publishedAt;
  await repo.updatePost(id, toRecord(input, slug, publishedAt), user.id);
  await repo.replacePostTags(id, input.tagIds);

  if (touchesLive) revalidatePublicBlog(existing.slug, slug);
  return repo.findPostById(id);
}

export async function deletePost(id: string): Promise<void> {
  const existing = await repo.findPostById(id);
  await repo.deletePost(id);
  if (existing.status === 'published') revalidatePublicBlog(existing.slug);
}

function normalizeTerm(input: BlogTermInput): Required<BlogTermInput> {
  const slug = slugify(input.slug || input.name);
  if (!slug) throw badRequest('Add a name with letters or numbers.');
  return { name: input.name, slug, description: input.description ?? '' };
}

export const listTerms = repo.findTerms;

export async function createTerm(kind: TaxonomyKind, input: BlogTermInput) {
  const term = await repo.insertTerm(kind, normalizeTerm(input));
  revalidatePublicBlog();
  return term;
}

export async function updateTerm(kind: TaxonomyKind, id: string, input: BlogTermInput) {
  await repo.updateTerm(kind, id, normalizeTerm(input));
  revalidatePublicBlog();
}

export async function deleteTerm(kind: TaxonomyKind, id: string) {
  await repo.deleteTerm(kind, id);
  revalidatePublicBlog();
}
