import { z } from 'zod';
import { schemaBlockSchema, type SchemaBlock } from '@/features/blog/structured-data/schema';

export const META_TITLE_MAX = 70;
export const META_DESCRIPTION_MAX = 160;

export const PLACEMENTS = ['head', 'body-start', 'body-end'] as const;
export type Placement = (typeof PLACEMENTS)[number];

export const PLACEMENT_META: Record<Placement, { label: string; tag: string; hint: string }> = {
  head: {
    label: 'Inside <head>',
    tag: 'Head',
    hint: 'Recommended. Google reads JSON-LD anywhere on the page; the head keeps it apart from the page content.',
  },
  'body-start': {
    label: 'Before body content',
    tag: 'Body start',
    hint: 'Right after the opening <body> tag, before the header and page content.',
  },
  'body-end': {
    label: 'After body content',
    tag: 'Body end',
    hint: 'At the end of the <body>, after the footer. Use it when a tool or guide asks for the end of the page.',
  },
};

export const pageSchemaItemSchema = z.object({
  id: z.string().trim().min(1).max(40),
  label: z.string().trim().max(120).default(''),
  placement: z.enum(PLACEMENTS).default('head'),
  enabled: z.boolean().default(true),
  block: schemaBlockSchema,
});

export type PageSchemaItem = z.infer<typeof pageSchemaItemSchema>;

export const pageSeoInputSchema = z.object({
  key: z.string().trim().min(1).max(300),
  path: z
    .string()
    .trim()
    .min(1)
    .max(300)
    .refine((v) => v.startsWith('/'), 'Path must start with /'),
  label: z.string().trim().max(200).default(''),
  metaTitle: z.string().trim().max(META_TITLE_MAX).default(''),
  metaDescription: z.string().trim().max(META_DESCRIPTION_MAX).default(''),
  schemas: z.array(pageSchemaItemSchema).max(20).default([]),
});

export type PageSeoInput = z.infer<typeof pageSeoInputSchema>;

export interface PageSeo {
  key: string;
  path: string;
  label: string;
  metaTitle: string;
  metaDescription: string;
  schemas: PageSchemaItem[];
  updatedAt: string | null;
}

export interface SeoCatalogItem {
  key: string;
  path: string;
  label: string;
  group: string;
  customized: boolean;
  blockCount: number;
  hasMeta: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
}

export function newSchemaId(): string {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function parseSchemas(raw: unknown): PageSchemaItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item, index) => {
    const wrapped = pageSchemaItemSchema.safeParse(item);
    if (wrapped.success) return [wrapped.data];
    const legacy = schemaBlockSchema.safeParse(item);
    return legacy.success ? [{ id: `legacy-${index}`, label: '', placement: 'head' as const, enabled: true, block: legacy.data as SchemaBlock }] : [];
  });
}
