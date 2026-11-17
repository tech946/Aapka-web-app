import { z } from 'zod';
import { SLUG_PATTERN } from '@/lib/slug';
import { BLOG_PAGE_SIZE, BLOG_STATUSES, SEO_DESCRIPTION_MAX, SEO_TITLE_MAX } from './constants';
import { EMPTY_BLOG_SCHEMA, blogSchemaSchema } from './structured-data/schema';

const optionalText = (max: number) => z.string().trim().max(max).optional().default('');

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .max(200)
  .refine((v) => v === '' || SLUG_PATTERN.test(v), 'Use lowercase letters, numbers and hyphens only')
  .optional()
  .default('');

export const blogPostInputSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  slug,
  excerpt: optionalText(500),
  contentHtml: z.string().max(500_000).default(''),
  coverImageUrl: optionalText(1000),
  coverImageAlt: optionalText(200),
  categoryId: z.string().uuid().nullable().optional().default(null),
  tagIds: z.array(z.string().uuid()).max(30).default([]),
  status: z.enum(BLOG_STATUSES).default('draft'),
  isFeatured: z.boolean().default(false),
  seoTitle: optionalText(SEO_TITLE_MAX),
  seoDescription: optionalText(SEO_DESCRIPTION_MAX),
  schema: blogSchemaSchema.default(EMPTY_BLOG_SCHEMA),
});

export const blogListQuerySchema = z.object({
  search: z.string().trim().max(200).optional().default(''),
  status: z.enum(BLOG_STATUSES).optional(),
  categoryId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(BLOG_PAGE_SIZE),
});

export const blogTermInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  slug,
  description: optionalText(500),
});

export type BlogPostInput = z.infer<typeof blogPostInputSchema>;
export type BlogListQuery = z.infer<typeof blogListQuerySchema>;
export type BlogTermInput = z.infer<typeof blogTermInputSchema>;
