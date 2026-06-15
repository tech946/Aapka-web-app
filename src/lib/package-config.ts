/**
 * Configuration for package categories
 * This file defines which categories use booking slots (unavailable dates) vs travel dates
 *
 * To add more categories that use booking slots, add their slugs to the array below
 */
export const BOOKING_SLOTS_CATEGORIES = ['uae-tours'] as const;

/**
 * Categories that use flexible date packages (calendar-based date selection with per-date pricing and seats)
 */
export const FLEXIBLE_DATE_PACKAGES_CATEGORIES = ['flexible-date-packages'] as const;

/**
 * Categories that support the show_listing_page toggle (offer & flexible date packages)
 */
export const LISTING_PAGE_TOGGLE_CATEGORIES = [
  'offer-packages',
  'flexible-date-packages',
] as const;

/**
 * Check if a category uses booking slots based on its slug
 * @param categorySlug - The slug of the category (e.g., 'uae-tours')
 * @returns true if the category uses booking slots, false otherwise
 */
export function usesBookingSlots(categorySlug: string): boolean {
  return BOOKING_SLOTS_CATEGORIES.includes(categorySlug.toLowerCase() as any);
}

/**
 * Check if a category uses booking slots based on its name
 * @param categoryName - The name of the category (e.g., 'UAE Tours')
 * @returns true if the category uses booking slots, false otherwise
 */
export function usesBookingSlotsByName(categoryName: string): boolean {
  // Convert name to slug format for comparison
  const slug = categoryName.toLowerCase().replace(/\s+/g, '-').trim();
  return usesBookingSlots(slug);
}

/**
 * Check if a category uses flexible date packages (calendar-based with per-date pricing and seats)
 * @param categorySlug - The slug of the category (e.g., 'flexible-date-packages')
 * @returns true if the category uses flexible date packages, false otherwise
 */
export function usesFlexibleDatePackages(categorySlug: string): boolean {
  return FLEXIBLE_DATE_PACKAGES_CATEGORIES.includes(categorySlug.toLowerCase() as any);
}

/**
 * Check if a category uses flexible date packages based on its name
 * @param categoryName - The name of the category (e.g., 'Flexible Date Packages')
 * @returns true if the category uses flexible date packages, false otherwise
 */
export function usesFlexibleDatePackagesByName(categoryName: string): boolean {
  // Convert name to slug format for comparison
  const slug = categoryName.toLowerCase().replace(/\s+/g, '-').trim();
  return usesFlexibleDatePackages(slug);
}

/**
 * Check if a category supports the show_listing_page toggle
 */
export function supportsListingPageToggle(categorySlug: string): boolean {
  return LISTING_PAGE_TOGGLE_CATEGORIES.includes(
    categorySlug.toLowerCase() as (typeof LISTING_PAGE_TOGGLE_CATEGORIES)[number]
  );
}

/**
 * One-off bookable dates for specific tours only (yyyy-MM-dd).
 * Other tours ignore this and use booking_days / booking_slots as normal.
 */
export const TOUR_FIXED_BOOKING_DATES: Partial<
  Record<string, readonly string[]>
> = {};

/** Default pre-selected date for tours with fixed dates (yyyy-MM-dd). */
export const TOUR_FIXED_BOOKING_DEFAULT_DATE: Partial<
  Record<string, string>
> = {};

/**
 * Tours that only allow specific weekdays within a single calendar month.
 * All other dates show as N/A. Uses the normal calendar UI (not a date dropdown).
 */
export type TourWeekendMonthRule = {
  year: number;
  /** 1–12 */
  month: number;
  /** JS getDay(): 0 = Sunday, 6 = Saturday */
  weekdays: readonly number[];
};

export const TOUR_WEEKEND_MONTH_BOOKING: Partial<
  Record<string, TourWeekendMonthRule>
> = {
  // Dhow Cruise Dinner - Marina (Unlimited buffet with Complimentary Drink)
  '2418e694-9c5a-4821-b1a7-88ce02aada59': {
    year: 2026,
    month: 9,
    weekdays: [0, 6],
  },
};

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getTourWeekendMonthRule(
  packageId: string | null | undefined
): TourWeekendMonthRule | null {
  if (!packageId) return null;
  return TOUR_WEEKEND_MONTH_BOOKING[packageId] ?? null;
}

export function hasTourWeekendMonthBooking(
  packageId: string | null | undefined
): boolean {
  return Boolean(getTourWeekendMonthRule(packageId));
}

export function isDateOnTourWeekendMonth(
  date: Date,
  packageId: string | null | undefined
): boolean {
  const rule = getTourWeekendMonthRule(packageId);
  if (!rule) return false;
  return (
    date.getFullYear() === rule.year &&
    date.getMonth() + 1 === rule.month &&
    rule.weekdays.includes(date.getDay())
  );
}

/** All yyyy-MM-dd dates allowed by a tour's weekend-month rule. */
export function getTourWeekendMonthAllowedDates(
  packageId: string | null | undefined
): string[] {
  const rule = getTourWeekendMonthRule(packageId);
  if (!rule) return [];
  const dates: string[] = [];
  const daysInMonth = new Date(rule.year, rule.month, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(rule.year, rule.month - 1, day);
    if (rule.weekdays.includes(d.getDay())) {
      dates.push(toDateString(rule.year, rule.month, day));
    }
  }
  return dates;
}

export function getTourWeekendMonthCalendarMonth(
  packageId: string | null | undefined
): Date | null {
  const rule = getTourWeekendMonthRule(packageId);
  if (!rule) return null;
  return new Date(rule.year, rule.month - 1, 1);
}

export function getTourFixedBookingDates(
  packageId: string | null | undefined
): string[] | null {
  if (!packageId) return null;
  const dates = TOUR_FIXED_BOOKING_DATES[packageId];
  return dates && dates.length > 0 ? [...dates] : null;
}

/** When a tour has fixed bookable dates, hide the calendar and use a date list instead. */
export function hasTourFixedBookingDates(
  packageId: string | null | undefined
): boolean {
  const dates = getTourFixedBookingDates(packageId);
  return Boolean(dates && dates.length > 0);
}

export function getTourDefaultFixedBookingDate(
  packageId: string | null | undefined
): string | null {
  const dates = getTourFixedBookingDates(packageId);
  if (!dates || dates.length === 0) return null;
  const configuredDefault = packageId
    ? TOUR_FIXED_BOOKING_DEFAULT_DATE[packageId]
    : undefined;
  if (configuredDefault && dates.includes(configuredDefault)) {
    return configuredDefault;
  }
  return dates[0];
}

/**
 * First bookable date for a weekend-month tour (respects today/tomorrow buffer).
 */
export function getTourDefaultWeekendMonthDate(
  packageId: string | null | undefined,
  earliestBookable: Date
): string | null {
  const allowed = getTourWeekendMonthAllowedDates(packageId);
  const earliestMs = earliestBookable.getTime();
  for (const dateStr of allowed) {
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) continue;
    const d = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    );
    if (d.getTime() >= earliestMs) return dateStr;
  }
  return allowed[0] ?? null;
}
