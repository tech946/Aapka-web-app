import { INCLUSION_ICON, THEMES, type ListingItem } from './listing-data';

/* What the listing can be narrowed and ordered by — shared by the desktop
   drawer + sort menu and the phone Filters / Sort sheets. A facet only
   shows when a package in the current view matches one of its options
   (ListingPage builds the live counts). */

export type FacetKey = 'theme' | 'highlight' | 'visa' | 'dur' | 'budget' | 'incl';

export interface FacetOption {
  value: string;
  label: string;
  test: (i: ListingItem) => boolean;
}

export interface FacetDef {
  key: FacetKey;
  title: string;
  /** short name for the phone sheet's section tabs */
  tab: string;
  /** phone sheet layout: a grid of tiles for a few short options, else checkbox rows */
  display: 'tiles' | 'list';
  options: FacetOption[];
}

/** A facet with the counts for the current view (options with 0 dropped). */
export type LiveFacet = FacetDef & { counts: Record<string, number> };

/** Picked option values per facet. */
export type FacetPicks = Partial<Record<FacetKey, string[]>>;

export const FACETS: FacetDef[] = [
  {
    key: 'theme',
    title: 'Experiences',
    tab: 'Experiences',
    display: 'list',
    options: THEMES.map((t) => ({ value: t.key, label: t.label, test: (i: ListingItem) => i.tags.includes(t.key) })),
  },
  {
    key: 'highlight',
    title: 'Highlights',
    tab: 'Highlights',
    display: 'list',
    options: [
      { value: 'deals', label: 'Deals & Offers', test: (i) => i.tags.includes('deals') },
      { value: 'solo', label: 'Solo Traveller', test: (i) => i.tags.includes('solo') },
      { value: 'new', label: 'New Arrivals', test: (i) => i.tags.includes('new') },
      { value: 'soon', label: 'Departing in 15 Days', test: (i) => i.tags.includes('soon') },
    ],
  },
  {
    key: 'visa',
    title: 'Visa',
    tab: 'Visa',
    display: 'tiles',
    options: [
      { value: 'Y', label: 'With Visa', test: (i) => i.visa === true },
      { value: 'N', label: 'Without Visa', test: (i) => i.visa === false },
    ],
  },
  {
    key: 'dur',
    title: 'Duration',
    tab: 'Duration',
    display: 'tiles',
    options: [
      { value: '0', label: 'Day Tours', test: (i) => i.nights === 0 },
      { value: '1-3', label: '1 – 3 Nights', test: (i) => i.nights >= 1 && i.nights <= 3 },
      { value: '4-6', label: '4 – 6 Nights', test: (i) => i.nights >= 4 && i.nights <= 6 },
      { value: '7+', label: '7 Nights & above', test: (i) => i.nights >= 7 },
    ],
  },
  {
    key: 'budget',
    title: 'Budget per person',
    tab: 'Budget',
    display: 'tiles',
    options: [
      { value: '0-150', label: 'Under AED 150', test: (i) => i.price != null && i.price < 150 },
      { value: '150-500', label: 'AED 150 – 500', test: (i) => i.price != null && i.price >= 150 && i.price < 500 },
      { value: '500-1500', label: 'AED 500 – 1,500', test: (i) => i.price != null && i.price >= 500 && i.price < 1500 },
      { value: '1500+', label: 'Above AED 1,500', test: (i) => i.price != null && i.price >= 1500 },
    ],
  },
  {
    key: 'incl',
    title: 'Must Include',
    tab: 'Inclusions',
    display: 'list',
    options: (Object.keys(INCLUSION_ICON) as Array<keyof typeof INCLUSION_ICON>).map((k) => ({
      value: k,
      label: k,
      test: (i: ListingItem) => i.inclusions.includes(k),
    })),
  },
];

/** Facets where one ticked option is enough to show (no choice needed). */
export const SINGLE_OPTION_FACETS: FacetKey[] = ['incl', 'highlight', 'theme'];

export interface SortDef {
  /** '' = the default order */
  value: string;
  title: string;
  sub: string;
}

/** Default order: grouped by holiday type (config order), newest first. */
export const DEFAULT_SORT: SortDef = { value: '', title: 'Recommended', sub: 'Newest first' };

export const SORTS: SortDef[] = [
  { value: 'price-asc', title: 'Price', sub: 'Low to High' },
  { value: 'price-desc', title: 'Price', sub: 'High to Low' },
  { value: 'dur-asc', title: 'Duration', sub: 'Shortest first' },
  { value: 'dur-desc', title: 'Duration', sub: 'Longest first' },
];

/** "Price Low to High" — the desktop menu and the trigger label. */
export function sortLabel(s: SortDef): string {
  return `${s.title} ${s.sub}`;
}
