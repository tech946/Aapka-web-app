import type { BlogStatus } from './constants';
import type { BlogSchema } from './structured-data/schema';

export interface BlogTerm {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  postCount: number;
}

export interface BlogPostSummary {
  id: string;
  title: string;
  slug: string;
  status: BlogStatus;
  coverImageUrl: string | null;
  category: { id: string; name: string } | null;
  authorName: string | null;
  publishedAt: string | null;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  contentHtml: string;
  coverImageUrl: string;
  coverImageAlt: string;
  categoryId: string | null;
  tagIds: string[];
  status: BlogStatus;
  isFeatured: boolean;
  seoTitle: string;
  seoDescription: string;
  schema: BlogSchema;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
