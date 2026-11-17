import type { ArticleType, SchemaBlock, SchemaBlockType } from './schema';

export const ARTICLE_TYPE_META: Record<ArticleType, { label: string; hint: string }> = {
  BlogPosting: { label: 'Blog post', hint: 'Best for most travel stories, guides and tips.' },
  Article: { label: 'Article', hint: 'For long-form editorial pieces.' },
  NewsArticle: { label: 'News article', hint: 'Only for timely news, such as visa rule changes.' },
};

interface BlockMeta {
  label: string;
  schemaType: string;
  hint: string;
  googleNote?: string;
}

export const SCHEMA_BLOCK_META: Record<SchemaBlockType, BlockMeta> = {
  faq: {
    label: 'FAQ',
    schemaType: 'FAQPage',
    hint: 'Questions and answers that also appear in the post.',
    googleNote: 'Google now shows FAQ rich results for very few sites, but other search and AI engines still read it.',
  },
  howto: {
    label: 'How-to steps',
    schemaType: 'HowTo',
    hint: 'Step-by-step instructions, e.g. how to apply for a visa.',
    googleNote: 'Google no longer shows How-to rich results; the markup is still valid schema.org.',
  },
  touristTrip: { label: 'Tour itinerary', schemaType: 'TouristTrip', hint: 'A trip with stops, e.g. a 4-day Dubai plan.' },
  destination: { label: 'Destination', schemaType: 'TouristDestination', hint: 'A place the post is about, e.g. Abu Dhabi.' },
  event: { label: 'Event', schemaType: 'Event', hint: 'A dated event, e.g. Dubai Shopping Festival.' },
  video: { label: 'Video', schemaType: 'VideoObject', hint: 'A video embedded in the post.' },
  review: { label: 'Review', schemaType: 'Review', hint: 'A rated review of a tour, hotel or place.' },
  custom: { label: 'Custom JSON-LD', schemaType: 'Any', hint: 'Paste any schema.org JSON-LD. For advanced use.' },
};

export const SCHEMA_BLOCK_TYPES = Object.keys(SCHEMA_BLOCK_META) as SchemaBlockType[];

export function newSchemaBlock(type: SchemaBlockType): SchemaBlock {
  switch (type) {
    case 'faq':
      return { type, items: [{ question: '', answer: '' }] };
    case 'howto':
      return { type, name: '', description: '', totalTime: '', steps: [{ name: '', text: '' }] };
    case 'touristTrip':
      return { type, name: '', description: '', touristType: '', stops: [{ name: '', description: '' }] };
    case 'destination':
      return { type, name: '', description: '', locality: '', country: '', image: '' };
    case 'event':
      return { type, name: '', description: '', startDate: '', endDate: '', locationName: '', address: '', url: '' };
    case 'video':
      return { type, name: '', description: '', thumbnailUrl: '', uploadDate: '', contentUrl: '', embedUrl: '' };
    case 'review':
      return { type, itemType: 'TouristTrip', itemName: '', ratingValue: 5, authorName: '', reviewBody: '' };
    case 'custom':
      return { type, json: '{\n  "@context": "https://schema.org",\n  "@type": ""\n}' };
  }
}
