import { z } from 'zod';

export const ARTICLE_TYPES = ['BlogPosting', 'Article', 'NewsArticle'] as const;
export type ArticleType = (typeof ARTICLE_TYPES)[number];

export const REVIEW_ITEM_TYPES = ['TouristTrip', 'TouristAttraction', 'Hotel', 'Restaurant', 'Organization', 'Product'] as const;

const text = (max: number) => z.string().trim().max(max).default('');
const url = z
  .string()
  .trim()
  .max(1000)
  .default('')
  .refine((v) => v === '' || /^(https?:\/\/|\/(?!\/))/i.test(v), 'Use a full https:// link or a path starting with /');
const isoDate = z
  .string()
  .trim()
  .max(40)
  .default('')
  .refine((v) => v === '' || !Number.isNaN(Date.parse(v)), 'Use a date like 2026-12-31 or 2026-12-31T19:00');
const duration = z
  .string()
  .trim()
  .max(20)
  .default('')
  .refine((v) => v === '' || /^P(?!$)(\d+D)?(T(?=\d)(\d+H)?(\d+M)?)?$/.test(v), 'Use a duration like PT2H30M or P3D');

function isTyped(item: unknown): boolean {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
  const type = (item as Record<string, unknown>)['@type'];
  return typeof type === 'string' || (Array.isArray(type) && type.length > 0 && type.every((t) => typeof t === 'string'));
}

function isJsonLdNode(item: unknown): boolean {
  if (isTyped(item)) return true;
  const graph = item && typeof item === 'object' && !Array.isArray(item) ? (item as Record<string, unknown>)['@graph'] : undefined;
  return Array.isArray(graph) && graph.length > 0 && graph.every(isTyped);
}

export function isJsonLd(value: string): boolean {
  try {
    const parsed = JSON.parse(value);
    const items = Array.isArray(parsed) ? parsed : [parsed];
    return items.length > 0 && items.every(isJsonLdNode);
  } catch {
    return false;
  }
}

const faqBlock = z.object({
  type: z.literal('faq'),
  items: z.array(z.object({ question: text(300), answer: text(3000) })).max(40).default([]),
});

const howToBlock = z.object({
  type: z.literal('howto'),
  name: text(200),
  description: text(1000),
  totalTime: duration,
  steps: z.array(z.object({ name: text(200), text: text(2000) })).max(40).default([]),
});

const touristTripBlock = z.object({
  type: z.literal('touristTrip'),
  name: text(200),
  description: text(1000),
  touristType: text(100),
  stops: z.array(z.object({ name: text(200), description: text(1000) })).max(40).default([]),
});

const destinationBlock = z.object({
  type: z.literal('destination'),
  name: text(200),
  description: text(1000),
  locality: text(100),
  country: text(100),
  image: url,
});

const eventBlock = z.object({
  type: z.literal('event'),
  name: text(200),
  description: text(1000),
  startDate: isoDate,
  endDate: isoDate,
  locationName: text(200),
  address: text(300),
  url,
});

const videoBlock = z.object({
  type: z.literal('video'),
  name: text(200),
  description: text(1000),
  thumbnailUrl: url,
  uploadDate: isoDate,
  contentUrl: url,
  embedUrl: url,
});

const reviewBlock = z.object({
  type: z.literal('review'),
  itemType: z.enum(REVIEW_ITEM_TYPES).default('TouristTrip'),
  itemName: text(200),
  ratingValue: z.coerce.number().min(1).max(5).default(5),
  authorName: text(100),
  reviewBody: text(3000),
});

const customBlock = z.object({
  type: z.literal('custom'),
  json: z.string().max(20_000).refine(isJsonLd, 'Enter valid JSON-LD. Each object needs an "@type".'),
});

export const schemaBlockSchema = z.discriminatedUnion('type', [faqBlock, howToBlock, touristTripBlock, destinationBlock, eventBlock, videoBlock, reviewBlock, customBlock]);

export const blogSchemaSchema = z.object({
  articleType: z.enum(ARTICLE_TYPES).default('BlogPosting'),
  blocks: z.array(schemaBlockSchema).max(12).default([]),
});

export type BlogSchema = z.infer<typeof blogSchemaSchema>;
export type SchemaBlock = z.infer<typeof schemaBlockSchema>;
export type SchemaBlockType = SchemaBlock['type'];

export const EMPTY_BLOG_SCHEMA: BlogSchema = { articleType: 'BlogPosting', blocks: [] };

export function parseBlogSchema(raw: unknown): BlogSchema {
  const result = blogSchemaSchema.safeParse(raw ?? {});
  return result.success ? result.data : EMPTY_BLOG_SCHEMA;
}
