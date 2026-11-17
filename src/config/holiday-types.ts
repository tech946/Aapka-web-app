/* ==========================================================================
   Holiday types — the one listing page (/holidays) and its filters
   --------------------------------------------------------------------------
   Every package the site sells shows on /holidays. Each "type" below is a
   filter chip there (?type=<key>) and decides how its cards read: label,
   price basis, the availability line and where "View Details" goes.

   Edit this file to rename a type, re-order the chips, change copy or point
   a type at a different hero image. Booking-calendar behaviour (fixed dates
   vs any-date calendar vs daily tour slots) still lives in
   lib/package-config.ts, which the detail pages read — `booking` below is
   derived from it so the two can never disagree.

   A category added in the CRM that isn't listed here still appears, with
   the DEFAULT_TYPE rules and its CRM name as the label.
   ========================================================================== */

import { usesBookingSlots, usesFlexibleDatePackages } from '@/lib/package-config';

/** How a package is booked (mirrors lib/package-config.ts). */
export type BookingKind = 'fixed-dates' | 'any-date' | 'tour-slots' | 'cruise';

/** Which price the card advertises. */
export type PriceBasis =
  /** solo-only packages show the solo rate, everything else the adult rate (package price as fallback) */
  | 'adult-or-solo'
  /** Marina: registration price in registration mode, else adult / package price */
  | 'marina';

export interface HolidayType {
  /** URL value (?type=…). For CRM categories this is the category slug. */
  key: string;
  /** filter chip, hero title and breadcrumb */
  label: string;
  /** small chip on each card */
  cardLabel: string;
  /** where the rows come from */
  source: { kind: 'category'; categorySlug: string } | { kind: 'marina' } | { kind: 'limited-deals' };
  priceBasis: PriceBasis;
  /** text under "Starting price" on the card */
  priceTag: string;
  /** one-line pitch in the Holidays menus (else the CRM description) */
  tagline?: string;
  /** chip order on the page (lower first) */
  order: number;
}

/** /holidays with no type picked */
export const ALL_TYPES = {
  key: 'all',
  label: 'All Holidays',
  tagline: 'Every package, tour & cruise',
};

export const HOLIDAY_TYPES: HolidayType[] = [
  {
    key: 'offer-packages',
    label: 'Offer Packages',
    cardLabel: 'Offer Package',
    source: { kind: 'category', categorySlug: 'offer-packages' },
    priceBasis: 'adult-or-solo',
    priceTag: 'Starting price per person',
    tagline: 'Hand-picked deals, all inclusive',
    order: 1,
  },
  {
    key: 'flexible-date-packages',
    label: 'Anydate Packages',
    cardLabel: 'Anydate',
    source: { kind: 'category', categorySlug: 'flexible-date-packages' },
    priceBasis: 'adult-or-solo',
    priceTag: 'Starting price per person',
    tagline: 'Travel on any date you choose',
    order: 2,
  },
  {
    key: 'uae-tours',
    label: 'UAE Tours',
    cardLabel: 'Tour',
    source: { kind: 'category', categorySlug: 'uae-tours' },
    priceBasis: 'adult-or-solo',
    priceTag: 'Price per adult',
    tagline: 'Desert safaris & city tours',
    order: 3,
  },
  {
    key: 'marina-cruise',
    label: 'Marina Cruise',
    cardLabel: 'Cruise',
    source: { kind: 'marina' },
    priceBasis: 'marina',
    priceTag: 'Starting price per person',
    tagline: 'Dinner cruise, Dubai Marina',
    order: 4,
  },
];

/** Limited-time deals: not a type of their own any more — a filter over
    the packages above. A package in a live deal gets the badge below and
    its card opens the deal page (which carries the deal's booking rules). */
export const LIMITED_DEALS = {
  key: 'limited-time-deals',
  label: 'Limited Time Deals',
  /** card badge; {date} = the deal's last day, e.g. "12 Oct" */
  badge: 'Deal ends {date}',
  detailPath: '/limited-time-deals',
};

/** Rules for a CRM category that isn't configured above. */
export const DEFAULT_TYPE: Omit<HolidayType, 'key' | 'label' | 'source' | 'order'> = {
  cardLabel: 'Package',
  priceBasis: 'adult-or-solo',
  priceTag: 'Starting price per person',
};

/** Packages shown to agents are discounted by their package's agent_discount
    (lib/agent-discount.ts); a "New" badge marks packages created within: */
export const NEW_BADGE_DAYS = 30;

/** Booking kind for a type, read from lib/package-config.ts. */
export function bookingKind(type: HolidayType): BookingKind {
  if (type.source.kind === 'marina') return 'cruise';
  if (type.source.kind !== 'category') return 'fixed-dates';
  const slug = type.source.categorySlug;
  if (usesFlexibleDatePackages(slug)) return 'any-date';
  if (usesBookingSlots(slug)) return 'tour-slots';
  return 'fixed-dates';
}

/** The /holidays link for a type key ("all" → the unfiltered page). */
export function holidaysHref(typeKey?: string | null): string {
  return !typeKey || typeKey === 'all' ? '/holidays' : `/holidays?type=${encodeURIComponent(typeKey)}`;
}

/** Type for a CRM category slug — configured, or built from the defaults. */
export function typeForCategory(slug: string, crmName: string, order = 50): HolidayType {
  const known = HOLIDAY_TYPES.find((t) => t.source.kind === 'category' && t.source.categorySlug === slug);
  return known ?? { key: slug, label: crmName, source: { kind: 'category', categorySlug: slug }, order, ...DEFAULT_TYPE };
}
