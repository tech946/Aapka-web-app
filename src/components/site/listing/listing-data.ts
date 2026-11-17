/* Listing data layer: turns production API rows (category packages, Marina
   cruises, limited-time deals) into one card shape for <ListingPage>.
   Per-type rules come from src/config/holiday-types.ts; every price rule
   below is the one the previous listing pages used. */

import {
  LIMITED_DEALS,
  NEW_BADGE_DAYS,
  bookingKind,
  type HolidayType,
} from '@/config/holiday-types';
import { getAgentDiscountPercentage } from '@/lib/agent-discount';
import { isPackagePriceRevealingSoon } from '@/lib/package-pricing';
import { getMarinaRegistrationPrices, isMarinaRegistrationMode } from '@/lib/marina-cruise-config';
import { generateShortSlug, parseDateStringToLocal } from '@/lib/utils';
import { getPackageDisplayImages } from '@/lib/package-gallery';

export type Inclusion = 'Flights' | 'Hotels' | 'Sightseeing' | 'Visa' | 'Meals' | 'Cruise' | 'Guide';

/** sprite symbol per inclusion (assets/images/commonIcons/svg-sprite-test.svg) */
export const INCLUSION_ICON: Record<Inclusion, string> = {
  Flights: 'flights',
  Hotels: 'hotel',
  Sightseeing: 'camera',
  Visa: 'visa',
  Meals: 'meal',
  Cruise: 'cruise-01',
  Guide: 'tourist',
};

/** Experience tags, read from each package's own name + description. */
export const THEMES: { key: string; label: string; test: RegExp }[] = [
  { key: 'safari', label: 'Desert Safari', test: /safari|desert/i },
  { key: 'city-tours', label: 'City Tours', test: /city tour|sightseeing/i },
  { key: 'cruises', label: 'Cruises', test: /cruise|dhow/i },
  { key: 'theme-parks', label: 'Theme Parks', test: /ferrari world|miracle garden|global village|theme park|aquarium|warner|yas/i },
  { key: 'abu-dhabi', label: 'Abu Dhabi', test: /abu dhabi/i },
];

export interface ListingItem {
  /** package id (unique across types) */
  id: string;
  /** HolidayType key — the type chip it belongs to */
  typeKey: string;
  href: string;
  name: string;
  img: string | null;
  /** thumbnail + gallery, as on the package page (desktop card slider) */
  images: string[];
  badge: string | null;
  /** "4N/5D", "5 Days" or '' */
  durationLabel: string;
  /** 0 = day tour; drives the duration facet + sort */
  nights: number;
  typeLabel: string;
  /** "Departs 21 Oct", "Any date till 30 Apr '27", "Daily"… */
  availability: string;
  /** upcoming fixed departure dates (YYYY-MM-DD), sorted; empty for other booking kinds */
  departures: string[];
  /** with visa included at no extra cost (null = not applicable) */
  visa: boolean | null;
  desc: string;
  inclusions: Inclusion[];
  /** price shown, discounts applied; null = revealing soon */
  price: number | null;
  /** pre-discount price when a discount applies */
  strike: number | null;
  offLabel: string | null;
  priceTag: string;
  createdAt: string | null;
  /** in a live limited-time deal */
  inDeal: boolean;
  /** facet keys: themes, 'deals', 'solo', 'new' */
  tags: string[];
}

export interface RawPackage {
  package_id: string;
  package_name: string;
  package_description?: string | null;
  package_price?: number | null;
  package_days?: number | null;
  package_nights?: number | null;
  adult_price?: number | null;
  child_price?: number | null;
  solo_traveller_price?: number | null;
  solo_traveller_enabled?: boolean | null;
  solo_traveller_only?: boolean | null;
  with_visa?: boolean | null;
  adult_visa_price?: number | null;
  child_visa_price?: number | null;
  infant_visa_price?: number | null;
  agent_discount?: number | null;
  adult_discount_amount?: number | null;
  discount_start_date?: string | null;
  discount_end_date?: string | null;
  active_deal?: { start_date: string; end_date: string; is_active: boolean } | null;
  travel_dates?: Array<{ id: string; value: string } | string> | null;
  booking_days?: number[] | null;
  start_date?: string | null;
  end_date?: string | null;
  overview?: string | null;
  holiday_description_html?: string | null;
  inclusion_html?: string | null;
  thumbnail_image?: string | null;
  created_at?: string | null;
  registration_only?: boolean | null;
  registration_adult_price?: number | null;
  registration_child_price?: number | null;
  [key: string]: unknown;
}

export interface RawDeal {
  id: string;
  offer_package_id?: string;
  end_date: string;
  package?: RawPackage | null;
}

/* ------------------------------------------------------------ helpers */

export function plain(html?: string | null): string {
  return String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatAed(n: number): string {
  return `AED ${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function shortDate(iso?: string | null, withYear = false): string {
  const d = parseDateStringToLocal(iso ?? null);
  if (!d) return '';
  const s = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return withYear ? `${s} '${String(d.getFullYear()).slice(2)}` : s;
}

function todayIso(): string {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

function durationOf(pkg: RawPackage): { label: string; nights: number } {
  const d = pkg.package_days ?? 0;
  const n = pkg.package_nights ?? (d > 0 ? d - 1 : 0);
  if (d > 0 && n > 0) return { label: `${n}N/${d}D`, nights: n };
  if (d > 0) return { label: `${d} Days`, nights: Math.max(0, d - 1) };
  if (n > 0) return { label: `${n} Nights`, nights: n };
  return { label: '', nights: 0 };
}

function descOf(pkg: RawPackage): string {
  return plain(pkg.overview) || plain(pkg.package_description) || plain(pkg.holiday_description_html);
}

/** "With visa" only when visa is included at zero cost — the previous rule. */
function visaIncluded(pkg: RawPackage): boolean {
  return !!pkg.with_visa && (pkg.adult_visa_price ?? 0) === 0 && (pkg.child_visa_price ?? 0) === 0 && (pkg.infant_visa_price ?? 0) === 0;
}

/** Inclusion icons read from the package's own inclusions text. */
export function inclusionsOf(pkg: RawPackage, visa: boolean | null): Inclusion[] {
  const text = plain(pkg.inclusion_html) || plain(pkg.overview) || plain(pkg.holiday_description_html);
  const out: Inclusion[] = [];
  if (/\bflights?\b|air ?ticket/i.test(text)) out.push('Flights');
  if (/hotel|\bstay\b|accommodation|resort/i.test(text)) out.push('Hotels');
  if (/sightseeing|city tour|safari|tour\b|visit|attraction|theme park/i.test(text)) out.push('Sightseeing');
  if (visa || /\bvisa\b/i.test(plain(pkg.inclusion_html))) out.push('Visa');
  if (/breakfast|lunch|dinner|meal|buffet|bbq/i.test(text)) out.push('Meals');
  if (/cruise|dhow/i.test(text)) out.push('Cruise');
  if (/\bguide\b|tour manager/i.test(text)) out.push('Guide');
  return out;
}

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function upcomingDepartures(pkg: RawPackage, type: HolidayType): string[] {
  if (bookingKind(type) !== 'fixed-dates') return [];
  const today = todayIso();
  const dates = (pkg.travel_dates ?? [])
    .map((d) => (typeof d === 'string' ? d : d?.value))
    .filter((d): d is string => !!d && d.slice(0, 10) >= today)
    .map((d) => d.slice(0, 10));
  return [...new Set(dates)].sort();
}

const SOON_DAYS = 15;

function departsSoon(departures: string[]): boolean {
  const first = departures[0] ? parseDateStringToLocal(departures[0]) : null;
  return !!first && first.getTime() - Date.now() <= SOON_DAYS * 24 * 60 * 60 * 1000;
}

/** When the package can be taken, worded per booking kind. */
export function availabilityOf(pkg: RawPackage, type: HolidayType): string {
  switch (bookingKind(type)) {
    case 'fixed-dates': {
      const upcoming = upcomingDepartures(pkg, type);
      if (!upcoming.length) return 'Dates on request';
      return upcoming.length === 1 ? `Departs ${shortDate(upcoming[0])}` : `${upcoming.length} departures from ${shortDate(upcoming[0])}`;
    }
    case 'any-date':
      return pkg.end_date ? `Any date till ${shortDate(pkg.end_date, true)}` : 'Any date';
    default: {
      const days = Array.isArray(pkg.booking_days) ? pkg.booking_days : [];
      if (!days.length || days.length === 7) return 'Daily';
      return [...days].sort().map((d) => WEEKDAY[d]).join(', ');
    }
  }
}

function isNew(createdAt?: string | null): boolean {
  return !!createdAt && Date.now() - new Date(createdAt).getTime() < NEW_BADGE_DAYS * 24 * 60 * 60 * 1000;
}

function dealOfDayIsLive(pkg: RawPackage): boolean {
  const d = pkg.active_deal;
  if (!d || !d.is_active) return false;
  const now = new Date();
  return now >= new Date(d.start_date) && now <= new Date(d.end_date);
}

function discountPct(pkg: RawPackage, isAgent: boolean): { pct: number; agent: boolean } {
  const agent = getAgentDiscountPercentage(pkg as never, isAgent);
  if (agent > 0) return { pct: agent, agent: true };
  if (pkg.discount_start_date && pkg.discount_end_date) {
    const now = new Date();
    if (now >= new Date(pkg.discount_start_date) && now <= new Date(pkg.discount_end_date)) {
      const base = pkg.adult_price || pkg.package_price || 0;
      if (base > 0 && pkg.adult_discount_amount) return { pct: Math.round((pkg.adult_discount_amount / base) * 100), agent: false };
    }
  }
  return { pct: 0, agent: false };
}

function tagsFor(item: Omit<ListingItem, 'tags'>, extra: string[] = []): string[] {
  const tags = [...extra];
  const text = item.name + ' ' + item.desc;
  THEMES.forEach((t) => t.test.test(text) && tags.push(t.key));
  if (item.strike != null || item.badge === 'Deal of the Day') tags.push('deals');
  if (isNew(item.createdAt)) tags.push('new');
  if (departsSoon(item.departures)) tags.push('soon');
  return [...new Set(tags)];
}

/* ------------------------------------------------------------ mappers */

/** /api/packages row → card. */
export function fromPackage(pkg: RawPackage, type: HolidayType, isAgent: boolean): ListingItem {
  const slug = type.source.kind === 'category' ? type.source.categorySlug : type.key;
  const { label, nights } = durationOf(pkg);
  const soloOnly = !!(pkg.solo_traveller_only && pkg.solo_traveller_enabled);
  const base = soloOnly ? (pkg.solo_traveller_price ?? pkg.adult_price ?? pkg.package_price ?? null) : pkg.adult_price || pkg.package_price || null;
  const revealing = isPackagePriceRevealingSoon(pkg as never) || !base;
  const { pct, agent } = discountPct(pkg, isAgent);
  const visa = visaIncluded(pkg);
  const item = {
    id: pkg.package_id,
    typeKey: type.key,
    href: `/category/${slug}/${generateShortSlug(pkg.package_name, pkg.package_id, pkg.package_days, pkg.package_nights)}`,
    name: pkg.package_name,
    img: pkg.thumbnail_image?.trim() || null,
    images: getPackageDisplayImages(pkg.gallery, pkg.thumbnail_image),
    badge: dealOfDayIsLive(pkg) ? 'Deal of the Day' : isNew(pkg.created_at) ? 'New' : soloOnly ? 'Solo Traveller' : null,
    durationLabel: label,
    nights,
    typeLabel: type.cardLabel,
    availability: availabilityOf(pkg, type),
    departures: upcomingDepartures(pkg, type),
    visa,
    desc: descOf(pkg),
    inclusions: inclusionsOf(pkg, visa),
    price: revealing ? null : pct > 0 ? (base as number) * (1 - pct / 100) : (base as number),
    strike: !revealing && pct > 0 ? (base as number) : null,
    offLabel: !revealing && pct > 0 ? (agent ? `${pct}% Agent` : `${pct}% OFF`) : null,
    priceTag: soloOnly ? 'Price per solo traveller' : type.priceTag,
    createdAt: pkg.created_at ?? null,
    inDeal: false,
  };
  return { ...item, tags: tagsFor(item, soloOnly ? ['solo'] : []) };
}

/** /api/marina-cruise-dinners row → card. */
export function fromMarina(pkg: RawPackage, type: HolidayType): ListingItem {
  const registration = isMarinaRegistrationMode(pkg as never);
  const reg = getMarinaRegistrationPrices(pkg as never);
  const revealing = !registration && isPackagePriceRevealingSoon(pkg as never);
  const price = registration ? (reg.adultPrice > 0 ? reg.adultPrice : null) : (pkg.adult_price ?? pkg.package_price ?? null);
  const item = {
    id: pkg.package_id,
    typeKey: type.key,
    href: `/marina-cruise-dinner/${generateShortSlug(pkg.package_name, pkg.package_id)}`,
    name: pkg.package_name,
    img: pkg.thumbnail_image?.trim() || null,
    images: getPackageDisplayImages(pkg.gallery, pkg.thumbnail_image),
    badge: registration ? 'Registration' : isNew(pkg.created_at) ? 'New' : null,
    durationLabel: '',
    nights: 0,
    typeLabel: type.cardLabel,
    availability: availabilityOf(pkg, type),
    departures: [],
    visa: null,
    desc: descOf(pkg),
    inclusions: inclusionsOf(pkg, null),
    price: revealing ? null : price,
    strike: null,
    offLabel: null,
    priceTag: registration ? 'Registration per adult' : type.priceTag,
    createdAt: pkg.created_at ?? null,
    inDeal: false,
  };
  return { ...item, tags: tagsFor(item) };
}

/** Mark a card as part of a live limited-time deal: badge, filter tag,
    "View Details" opens the deal page (deal booking rules live there), and
    the price follows the deal page — adult (or solo) rate, agent discount
    only, as the old /limited-time-deals listing showed it. */
export function applyDeal(item: ListingItem, deal: RawDeal, isAgent: boolean): ListingItem {
  const pkg = deal.package as RawPackage;
  const ends = shortDate(deal.end_date);
  const soloOnly = !!(pkg.solo_traveller_only && pkg.solo_traveller_enabled);
  const base = soloOnly ? (pkg.solo_traveller_price ?? pkg.adult_price ?? 0) : (pkg.adult_price ?? 0);
  const pct = getAgentDiscountPercentage(pkg as never, isAgent);
  const pricing =
    base > 0
      ? {
          price: pct > 0 ? base * (1 - pct / 100) : base,
          strike: pct > 0 ? base : null,
          offLabel: pct > 0 ? `${pct}% Agent` : null,
          priceTag: soloOnly ? 'Price per solo traveller' : 'Starting price per person',
        }
      : {};
  return {
    ...item,
    ...pricing,
    inDeal: true,
    badge: ends ? LIMITED_DEALS.badge.replace('{date}', ends) : LIMITED_DEALS.label,
    href: `${LIMITED_DEALS.detailPath}/${generateShortSlug(pkg.package_name, pkg.package_id, pkg.package_days ?? null, pkg.package_nights ?? null)}`,
    tags: [...new Set([...item.tags, 'deals'])],
  };
}

