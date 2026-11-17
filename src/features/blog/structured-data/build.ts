import type { BlogSchema, SchemaBlock } from './schema';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.aapkatourism.com').replace(/\/$/, '');
const SITE_NAME = 'Aapka Tourism';
const LOGO_PATH = '/brand/aapka-sun-mark.png';

export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue | undefined };

export interface BlogJsonLdContext {
  slug: string;
  title: string;
  description: string;
  image: string | null;
  datePublished: string | null;
  dateModified: string | null;
  authorName: string | null;
  category: { name: string; slug: string } | null;
  tags: string[];
}

export const absolute = (value: string | null | undefined): string | undefined => {
  if (!value) return undefined;
  return value.startsWith('/') ? `${SITE_URL}${value}` : value;
};

export function compact(value: JsonValue | undefined): JsonValue | undefined {
  if (value === '' || value === undefined || value === null) return undefined;
  if (Array.isArray(value)) {
    const items = value.map(compact).filter((v): v is JsonValue => v !== undefined);
    return items.length ? items : undefined;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([k, v]) => [k, compact(v)] as const)
      .filter(([, v]) => v !== undefined);
    return entries.length ? (Object.fromEntries(entries) as JsonObject) : undefined;
  }
  return value;
}

export const organization = (): JsonObject => ({
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: { '@type': 'ImageObject', url: `${SITE_URL}${LOGO_PATH}` },
});

function articleNode(schema: BlogSchema, ctx: BlogJsonLdContext, url: string): JsonObject {
  return {
    '@type': schema.articleType,
    '@id': `${url}#article`,
    headline: ctx.title.slice(0, 110),
    description: ctx.description,
    image: absolute(ctx.image) ? [absolute(ctx.image)!] : undefined,
    datePublished: ctx.datePublished ?? undefined,
    dateModified: ctx.dateModified ?? ctx.datePublished ?? undefined,
    author: ctx.authorName ? { '@type': 'Person', name: ctx.authorName } : organization(),
    publisher: organization(),
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    articleSection: ctx.category?.name,
    keywords: ctx.tags.length ? ctx.tags.join(', ') : undefined,
    inLanguage: 'en',
  };
}

function breadcrumbNode(ctx: BlogJsonLdContext, url: string): JsonObject {
  const trail = [
    { name: 'Home', item: SITE_URL },
    { name: 'Blog', item: `${SITE_URL}/blogs` },
    ...(ctx.category ? [{ name: ctx.category.name, item: `${SITE_URL}/blogs/category/${ctx.category.slug}` }] : []),
    { name: ctx.title, item: url },
  ];
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((step, i) => ({ '@type': 'ListItem', position: i + 1, name: step.name, item: step.item })),
  };
}

export function blockNode(block: Exclude<SchemaBlock, { type: 'custom' }>, url: string): JsonObject {
  switch (block.type) {
    case 'faq':
      return {
        '@type': 'FAQPage',
        mainEntity: block.items
          .filter((i) => i.question && i.answer)
          .map((i) => ({ '@type': 'Question', name: i.question, acceptedAnswer: { '@type': 'Answer', text: i.answer } })),
      };
    case 'howto':
      return {
        '@type': 'HowTo',
        name: block.name,
        description: block.description,
        totalTime: block.totalTime,
        step: block.steps.filter((s) => s.text || s.name).map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, text: s.text || s.name })),
      };
    case 'touristTrip':
      return {
        '@type': 'TouristTrip',
        name: block.name,
        description: block.description,
        touristType: block.touristType,
        url,
        itinerary: {
          '@type': 'ItemList',
          itemListElement: block.stops
            .filter((s) => s.name)
            .map((s, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Place', name: s.name, description: s.description } })),
        },
      };
    case 'destination':
      return {
        '@type': 'TouristDestination',
        name: block.name,
        description: block.description,
        image: absolute(block.image),
        address: { '@type': 'PostalAddress', addressLocality: block.locality, addressCountry: block.country },
      };
    case 'event':
      return {
        '@type': 'Event',
        name: block.name,
        description: block.description,
        startDate: block.startDate,
        endDate: block.endDate,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        location: { '@type': 'Place', name: block.locationName, address: block.address },
        url: absolute(block.url),
      };
    case 'video':
      return {
        '@type': 'VideoObject',
        name: block.name,
        description: block.description,
        thumbnailUrl: absolute(block.thumbnailUrl),
        uploadDate: block.uploadDate,
        contentUrl: absolute(block.contentUrl),
        embedUrl: absolute(block.embedUrl),
      };
    case 'review':
      return {
        '@type': 'Review',
        itemReviewed: { '@type': block.itemType, name: block.itemName },
        reviewRating: { '@type': 'Rating', ratingValue: block.ratingValue, bestRating: 5, worstRating: 1 },
        author: block.authorName ? { '@type': 'Person', name: block.authorName } : organization(),
        reviewBody: block.reviewBody,
      };
  }
}

export function buildBlogJsonLd(schema: BlogSchema, ctx: BlogJsonLdContext): JsonValue[] {
  const url = `${SITE_URL}/blogs/${ctx.slug}`;
  const nodes: JsonValue[] = [articleNode(schema, ctx, url), breadcrumbNode(ctx, url)];
  const documents: JsonValue[] = [];

  for (const block of schema.blocks) {
    if (block.type === 'custom') {
      try {
        documents.push(JSON.parse(block.json) as JsonValue);
      } catch {
        continue;
      }
    } else {
      nodes.push(blockNode(block, url));
    }
  }

  const graph = compact({ '@context': 'https://schema.org', '@graph': nodes });
  return [graph, ...documents].filter((d): d is JsonValue => d !== undefined);
}

export function serializeJsonLd(data: JsonValue): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
