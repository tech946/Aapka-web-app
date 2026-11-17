import type { BlogCard, BlogDetail, BlogNav, BlogTermRef } from './public';
import { EMPTY_BLOG_SCHEMA } from './structured-data/schema';

const CATEGORIES = {
  dubai: { name: 'Dubai', slug: 'dubai' },
  abuDhabi: { name: 'Abu Dhabi', slug: 'abu-dhabi' },
  tips: { name: 'Travel Tips', slug: 'travel-tips' },
  oman: { name: 'Oman', slug: 'oman' },
} satisfies Record<string, BlogTermRef>;

const TAGS = {
  family: { name: 'Family', slug: 'family' },
  budget: { name: 'Budget', slug: 'budget' },
  desert: { name: 'Desert', slug: 'desert' },
  cruise: { name: 'Cruise', slug: 'cruise' },
} satisfies Record<string, BlogTermRef>;

interface FallbackPost extends BlogDetail {
  featured: boolean;
}

function post(p: Omit<FallbackPost, 'created_at' | 'coverAlt' | 'authorName' | 'seo_title' | 'seo_description' | 'updated_at' | 'schema'>): FallbackPost {
  return { ...p, created_at: p.published_at, coverAlt: p.title, authorName: 'Aapka Tourism', seo_title: null, seo_description: null, updated_at: p.published_at, schema: EMPTY_BLOG_SCHEMA };
}

const FALLBACK_POSTS: FallbackPost[] = [
  post({
    id: 'sample-dubai-first-trip',
    slug: 'first-trip-to-dubai-guide',
    title: 'Your First Trip to Dubai: A Complete 5-Day Guide',
    excerpt: 'From the Burj Khalifa at sunset to a dhow dinner on the creek, here is how to see the best of Dubai in five relaxed days.',
    featured_image: '/images/package-3.jpg',
    published_at: '2026-11-08T09:00:00.000Z',
    reading_minutes: 8,
    blog_categories: CATEGORIES.dubai,
    tags: [TAGS.family],
    featured: true,
    html: '<p>Dubai rewards a little planning. Spend day one in Downtown for the Burj Khalifa and the fountain show, day two in Old Dubai around the creek and souks, and keep day three for a desert safari.</p><h2>When to go</h2><p>November to March brings pleasant weather and the busiest events calendar.</p><h2>Where to stay</h2><ul><li>Downtown for first-timers</li><li>Dubai Marina for beach days</li><li>Deira for value and the old city</li></ul>',
  }),
  post({
    id: 'sample-desert-safari',
    slug: 'desert-safari-what-to-expect',
    title: 'Desert Safari in Dubai: What to Expect and How to Choose',
    excerpt: 'Dune bashing, camel rides and a barbecue under the stars. We compare morning, evening and overnight safaris so you can pick the right one.',
    featured_image: '/images/about-hero.jpg',
    published_at: '2026-11-05T09:00:00.000Z',
    reading_minutes: 6,
    blog_categories: CATEGORIES.dubai,
    tags: [TAGS.desert, TAGS.family],
    featured: true,
    html: '<p>The evening safari is the most popular choice: dune drive at golden hour, sunset photos and dinner with live shows at a desert camp.</p><h2>Good to know</h2><ul><li>Wear closed shoes and carry a light jacket in winter</li><li>Dune bashing is not advised for pregnant travellers</li></ul>',
  }),
  post({
    id: 'sample-abu-dhabi-day',
    slug: 'abu-dhabi-day-trip-from-dubai',
    title: 'The Perfect Abu Dhabi Day Trip from Dubai',
    excerpt: 'Sheikh Zayed Grand Mosque, the Louvre Abu Dhabi and Yas Island — all in a single, well-paced day.',
    featured_image: '/images/about-section-1.jpg',
    published_at: '2026-11-01T09:00:00.000Z',
    reading_minutes: 7,
    blog_categories: CATEGORIES.abuDhabi,
    tags: [TAGS.family],
    featured: false,
    html: '<p>Leave Dubai early to reach the Grand Mosque by 9 am, then continue to Saadiyat Island for the Louvre before an afternoon at Yas Island.</p>',
  }),
  post({
    id: 'sample-marina-cruise',
    slug: 'dubai-marina-dinner-cruise',
    title: 'Is a Dubai Marina Dinner Cruise Worth It?',
    excerpt: 'Two hours on the water, a buffet dinner and the skyline lit up around you. Here is what is included and how to get the best seats.',
    featured_image: '/images/package-2.jpg',
    published_at: '2026-10-28T09:00:00.000Z',
    reading_minutes: 5,
    blog_categories: CATEGORIES.dubai,
    tags: [TAGS.cruise],
    featured: false,
    html: '<p>Boarding usually starts around 8 pm. Ask for an upper-deck table for the best views of the Marina and JBR.</p>',
  }),
  post({
    id: 'sample-uae-visa-tips',
    slug: 'uae-travel-tips-for-indian-travellers',
    title: '12 UAE Travel Tips Every Indian Traveller Should Know',
    excerpt: 'Visas, currency, dress codes and the metro — the practical things that make a UAE holiday smoother.',
    featured_image: '/images/about-section-2.jpg',
    published_at: '2026-10-22T09:00:00.000Z',
    reading_minutes: 9,
    blog_categories: CATEGORIES.tips,
    tags: [TAGS.budget],
    featured: false,
    html: '<p>Carry a mix of card and cash, buy a Nol card for the metro, and keep shoulders and knees covered when visiting mosques.</p>',
  }),
  post({
    id: 'sample-oman-musandam',
    slug: 'musandam-oman-dhow-cruise',
    title: 'Musandam, Oman: Fjords, Dolphins and a Dhow Cruise',
    excerpt: 'A short drive from Dubai, Musandam feels a world away. Plan a day of snorkelling and dolphin spotting in the fjords.',
    featured_image: '/images/about-section-3.jpg',
    published_at: '2026-10-15T09:00:00.000Z',
    reading_minutes: 6,
    blog_categories: CATEGORIES.oman,
    tags: [TAGS.cruise],
    featured: false,
    html: '<p>Carry your passport and Oman visa. Most tours include lunch on board and a stop for snorkelling.</p>',
  }),
];

function toCard({ html: _h, coverAlt: _c, tags: _t, authorName: _a, seo_title: _s, seo_description: _d, updated_at: _u, schema: _sc, featured: _f, ...card }: FallbackPost): BlogCard {
  return card;
}

export const FALLBACK_NAV: BlogNav = {
  categories: Object.values(CATEGORIES),
  tags: Object.values(TAGS),
};

export function fallbackPosts(filter: { categorySlug?: string; tagSlug?: string; search?: string; featuredOnly?: boolean } = {}): BlogCard[] {
  const search = filter.search?.toLowerCase().trim();
  return FALLBACK_POSTS.filter(
    (p) =>
      (!filter.categorySlug || p.blog_categories?.slug === filter.categorySlug) &&
      (!filter.tagSlug || p.tags.some((t) => t.slug === filter.tagSlug)) &&
      (!filter.featuredOnly || p.featured) &&
      (!search || `${p.title} ${p.excerpt}`.toLowerCase().includes(search)),
  ).map(toCard);
}

export function fallbackPost(slug: string): BlogDetail | null {
  const found = FALLBACK_POSTS.find((p) => p.slug === slug);
  if (!found) return null;
  const { featured: _f, ...detail } = found;
  return detail;
}

export function fallbackTerm(kind: 'categories' | 'tags', slug: string): BlogTermRef | null {
  return FALLBACK_NAV[kind].find((t) => t.slug === slug) ?? null;
}
