import type { BadgeTone } from '@/components/dashboard/kit/Badge';

export const BLOG_STATUSES = ['draft', 'published', 'archived'] as const;

export type BlogStatus = (typeof BLOG_STATUSES)[number];

export const BLOG_STATUS_META: Record<BlogStatus, { label: string; tone: BadgeTone }> = {
  draft: { label: 'Draft', tone: 'warning' },
  published: { label: 'Published', tone: 'success' },
  archived: { label: 'Archived', tone: 'neutral' },
};

export const BLOG_PAGE_SIZE = 20;

export const BLOG_UPLOAD_FOLDER = 'blogs';

export const SEO_TITLE_MAX = 70;
export const SEO_DESCRIPTION_MAX = 160;

export type TaxonomyKind = 'categories' | 'tags';

export const TAXONOMY_META: Record<TaxonomyKind, { table: string; singular: string; plural: string }> = {
  categories: { table: 'blog_categories', singular: 'Category', plural: 'Categories' },
  tags: { table: 'blog_tags', singular: 'Tag', plural: 'Tags' },
};
