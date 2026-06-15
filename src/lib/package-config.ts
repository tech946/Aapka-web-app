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
 * Tours that allow specific weekdays from the current month through an end month.
 * Past months are hidden; past dates within the window are disabled in the calendar.
 */
export type TourWeekendRangeRule = {
  endYear: number;
  /** 1–12, inclusive through the last day of this month */
  endMonth: number;
  /** JS getDay(): 0 = Sunday, 6 = Saturday */
  weekdays: readonly number[];
  /** Additional yyyy-MM-dd dates always allowed within the window */
  extraDates?: readonly string[];
  /** Allow booking today (other UAE tours require day after tomorrow) */
  allowTodayBooking?: boolean;
};

export const TOUR_WEEKEND_RANGE_BOOKING: Partial<
  Record<string, TourWeekendRangeRule>
> = {
  // Dhow Cruise Dinner - Marina (Unlimited buffet with Complimentary Drink)
  '2418e694-9c5a-4821-b1a7-88ce02aada59': {
    endYear: 2026,
    endMonth: 9,
    weekdays: [0, 6],
    extraDates: ['2026-06-15'],
    allowTodayBooking: true,
  },
};

function toDateString(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getTourWeekendRangeRule(
  packageId: string | null | undefined
): TourWeekendRangeRule | null {
  if (!packageId) return null;
  return TOUR_WEEKEND_RANGE_BOOKING[packageId] ?? null;
}

export function hasTourWeekendRangeBooking(
  packageId: string | null | undefined
): boolean {
  return Boolean(getTourWeekendRangeRule(packageId));
}

/** Last calendar day included in the booking window. */
export function getTourWeekendRangeEndDate(
  packageId: string | null | undefined
): Date | null {
  const rule = getTourWeekendRangeRule(packageId);
  if (!rule) return null;
  return new Date(rule.endYear, rule.endMonth, 0);
}

function dateToYmd(date: Date): string {
  return toDateString(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

function parseYmdDate(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function getTourWeekendRangeEarliestBookable(
  packageId: string | null | undefined,
  now: Date = new Date()
): Date {
  const rule = getTourWeekendRangeRule(packageId);
  const today = startOfLocalDay(now);
  if (rule?.allowTodayBooking) return today;
  const earliest = new Date(today);
  earliest.setDate(earliest.getDate() + 2);
  return earliest;
}

export function isDateOnTourWeekendRange(
  date: Date,
  packageId: string | null | undefined
): boolean {
  const rule = getTourWeekendRangeRule(packageId);
  if (!rule) return false;
  const endDate = getTourWeekendRangeEndDate(packageId);
  if (!endDate) return false;

  const check = startOfLocalDay(date);
  if (check > endDate) return false;

  const dateStr = dateToYmd(check);
  if (rule.extraDates?.includes(dateStr)) return true;

  return rule.weekdays.includes(check.getDay());
}

export function isTourWeekendRangeExtraDate(
  date: Date,
  packageId: string | null | undefined
): boolean {
  const rule = getTourWeekendRangeRule(packageId);
  if (!rule?.extraDates?.length) return false;
  return rule.extraDates.includes(dateToYmd(startOfLocalDay(date)));
}

/** Allowed weekend-range dates ignore dashboard booking_slots blocks. */
export function shouldSkipTourBookingSlotsForDate(
  date: Date,
  packageId: string | null | undefined
): boolean {
  return (
    hasTourWeekendRangeBooking(packageId) &&
    isDateOnTourWeekendRange(date, packageId)
  );
}

/** Calendar bounds: current month → end month (past months excluded). */
export function getTourWeekendRangeCalendarBounds(
  packageId: string | null | undefined,
  now: Date = new Date()
): { fromMonth: Date; toMonth: Date } | null {
  const rule = getTourWeekendRangeRule(packageId);
  if (!rule) return null;

  const endDate = getTourWeekendRangeEndDate(packageId)!;
  const today = startOfLocalDay(now);

  if (today > endDate) return null;

  const fromMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const toMonth = new Date(rule.endYear, rule.endMonth - 1, 1);

  if (fromMonth > toMonth) return null;

  return { fromMonth, toMonth };
}

export function getTourWeekendRangeInitialMonth(
  packageId: string | null | undefined,
  now: Date = new Date()
): Date | null {
  return getTourWeekendRangeCalendarBounds(packageId, now)?.fromMonth ?? null;
}

/** Sat/Sun dates from earliestBookable through end of the configured month. */
export function getTourWeekendRangeAllowedDates(
  packageId: string | null | undefined,
  earliestBookable: Date
): string[] {
  const rule = getTourWeekendRangeRule(packageId);
  const endDate = getTourWeekendRangeEndDate(packageId);
  if (!rule || !endDate) return [];

  const earliest = startOfLocalDay(earliestBookable);
  const dates: string[] = [];

  let cursor = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
  const endMonthStart = new Date(rule.endYear, rule.endMonth - 1, 1);

  while (cursor <= endMonthStart) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month - 1, day);
      if (d < earliest || d > endDate) continue;
      if (rule.weekdays.includes(d.getDay())) {
        dates.push(toDateString(year, month, day));
      }
    }

    cursor = new Date(year, month, 1);
  }

  if (rule.extraDates?.length) {
    for (const dateStr of rule.extraDates) {
      const d = parseYmdDate(dateStr);
      if (!d || d < earliest || d > endDate) continue;
      if (!dates.includes(dateStr)) dates.push(dateStr);
    }
  }

  dates.sort();
  return dates;
}

/**
 * First bookable Sat/Sun on or after earliestBookable, within the range window.
 */
export function getTourDefaultWeekendRangeDate(
  packageId: string | null | undefined,
  earliestBookable: Date
): string | null {
  const allowed = getTourWeekendRangeAllowedDates(packageId, earliestBookable);
  return allowed[0] ?? null;
}

/** @deprecated Use getTourWeekendRangeRule */
export type TourWeekendMonthRule = TourWeekendRangeRule;

/** @deprecated Use getTourWeekendRangeRule */
export function getTourWeekendMonthRule(
  packageId: string | null | undefined
): TourWeekendRangeRule | null {
  return getTourWeekendRangeRule(packageId);
}

/** @deprecated Use hasTourWeekendRangeBooking */
export function hasTourWeekendMonthBooking(
  packageId: string | null | undefined
): boolean {
  return hasTourWeekendRangeBooking(packageId);
}

/** @deprecated Use isDateOnTourWeekendRange */
export function isDateOnTourWeekendMonth(
  date: Date,
  packageId: string | null | undefined
): boolean {
  return isDateOnTourWeekendRange(date, packageId);
}

/** @deprecated Use getTourWeekendRangeAllowedDates */
export function getTourWeekendMonthAllowedDates(
  packageId: string | null | undefined
): string[] {
  const tomorrow = startOfLocalDay(new Date());
  tomorrow.setDate(tomorrow.getDate() + 2);
  return getTourWeekendRangeAllowedDates(packageId, tomorrow);
}

/** @deprecated Use getTourWeekendRangeInitialMonth */
export function getTourWeekendMonthCalendarMonth(
  packageId: string | null | undefined
): Date | null {
  return getTourWeekendRangeInitialMonth(packageId);
}

/** @deprecated Use getTourDefaultWeekendRangeDate */
export function getTourDefaultWeekendMonthDate(
  packageId: string | null | undefined,
  earliestBookable: Date
): string | null {
  return getTourDefaultWeekendRangeDate(packageId, earliestBookable);
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

