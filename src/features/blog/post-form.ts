import type { BlogStatus } from './constants';
import type { BlogPostInput } from './schemas';
import { slugify } from '@/lib/slug';
import type { BlogJsonLdContext } from './structured-data/build';
import { EMPTY_BLOG_SCHEMA } from './structured-data/schema';
import type { BlogPost, BlogTerm } from './types';

export type PostFormValues = Required<Omit<BlogPostInput, 'status'>>;

export const EMPTY_POST_FORM: PostFormValues = {
  title: '',
  slug: '',
  excerpt: '',
  contentHtml: '',
  coverImageUrl: '',
  coverImageAlt: '',
  categoryId: null,
  tagIds: [],
  isFeatured: false,
  seoTitle: '',
  seoDescription: '',
  schema: EMPTY_BLOG_SCHEMA,
};

export function postToForm(post: BlogPost): PostFormValues {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    contentHtml: post.contentHtml,
    coverImageUrl: post.coverImageUrl,
    coverImageAlt: post.coverImageAlt,
    categoryId: post.categoryId,
    tagIds: post.tagIds,
    isFeatured: post.isFeatured,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    schema: post.schema,
  };
}

export interface SaveAction {
  label: string;
  status: BlogStatus;
  primary: boolean;
}

export function saveActionsFor(current: BlogStatus | null, canPublish: boolean): SaveAction[] {
  if (current === 'published') {
    return canPublish
      ? [
          { label: 'Unpublish', status: 'draft', primary: false },
          { label: 'Update', status: 'published', primary: true },
        ]
      : [];
  }
  const actions: SaveAction[] = [{ label: current === 'archived' ? 'Save' : 'Save draft', status: current ?? 'draft', primary: !canPublish }];
  if (canPublish) actions.push({ label: 'Publish', status: 'published', primary: true });
  return actions;
}

export function schemaPreviewContext(values: PostFormValues, post: BlogPost | undefined, categories: BlogTerm[], tags: BlogTerm[]): BlogJsonLdContext {
  const category = categories.find((c) => c.id === values.categoryId);
  return {
    slug: values.slug || slugify(values.title) || 'new-post',
    title: values.seoTitle || values.title,
    description: values.seoDescription || values.excerpt,
    image: values.coverImageUrl || null,
    datePublished: post?.publishedAt ?? null,
    dateModified: post?.updatedAt ?? null,
    authorName: null,
    category: category ? { name: category.name, slug: category.slug } : null,
    tags: tags.filter((t) => values.tagIds.includes(t.id)).map((t) => t.name),
  };
}

export function schemaErrorMessage(errors: Record<string, string>): string | null {
  const entry = Object.entries(errors).find(([key]) => key === 'schema' || key.startsWith('schema.'));
  if (!entry) return null;
  const block = /^schema\.blocks\.(\d+)/.exec(entry[0]);
  return block ? `Schema ${Number(block[1]) + 1}: ${entry[1]}` : entry[1];
}

export function withoutSchemaErrors(errors: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(errors).filter(([key]) => key !== 'schema' && !key.startsWith('schema.')));
}
