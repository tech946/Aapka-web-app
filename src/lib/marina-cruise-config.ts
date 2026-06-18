/**
 * Configuration for Marina Cruise Dinner (standalone entity, not part of tour packages)
 */

export const MARINA_CRUISE_SLUG = 'marina-cruise-dinner' as const;

export type MarinaRegistrationFields = {
  registration_only?: boolean | null;
  registration_adult_price?: number | null;
  registration_child_price?: number | null;
  adult_price?: number | null;
  child_price?: number | null;
  package_price?: number | null;
};

export function hasMarinaRegularPricing(
  pkg: MarinaRegistrationFields | null | undefined
): boolean {
  if (!pkg) return false;
  const ap = Number(pkg.adult_price) || 0;
  const cp = Number(pkg.child_price) || 0;
  const pp = Number(pkg.package_price) || 0;
  return ap > 0 || cp > 0 || pp > 0;
}

/** Registration-only when flag is on and no regular adult/child/package price. */
export function isMarinaRegistrationMode(
  pkg: MarinaRegistrationFields | null | undefined
): boolean {
  if (!pkg?.registration_only) return false;
  return !hasMarinaRegularPricing(pkg);
}

export function getMarinaRegistrationPrices(
  pkg: MarinaRegistrationFields | null | undefined
): { adultPrice: number; childPrice: number } {
  return {
    adultPrice: Number(pkg?.registration_adult_price) || 0,
    childPrice: Number(pkg?.registration_child_price) || 0,
  };
}

export type MarinaAddon = {
  id: string;
  name: string;
  adult_price: number | null;
  child_price: number | null;
};

export function parseMarinaAddons(raw: unknown): MarinaAddon[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((a): a is Record<string, unknown> => !!a && typeof a === 'object')
    .map(a => ({
      id: String(a.id ?? ''),
      name: String(a.name ?? '').trim(),
      adult_price:
        a.adult_price != null && a.adult_price !== ''
          ? Number(a.adult_price)
          : null,
      child_price:
        a.child_price != null && a.child_price !== ''
          ? Number(a.child_price)
          : null,
    }))
    .filter(a => a.id && a.name);
}

export function calcMarinaAddonsPrice(
  allAddons: MarinaAddon[] | unknown,
  selectedIds: string[] | undefined,
  adults: number,
  children: number
): number {
  const ids = selectedIds?.filter(Boolean) || [];
  if (!ids.length) return 0;
  const list = parseMarinaAddons(allAddons);
  let total = 0;
  for (const id of ids) {
    const addon = list.find(a => a.id === id);
    if (!addon) continue;
    total += (Number(addon.adult_price) || 0) * adults;
    total += (Number(addon.child_price) || 0) * children;
  }
  return total;
}

export function getMarinaAddonLabels(
  allAddons: MarinaAddon[] | unknown,
  selectedIds: string[] | undefined
): string[] {
  const list = parseMarinaAddons(allAddons);
  return (selectedIds || [])
    .map(id => list.find(a => a.id === id)?.name)
    .filter((n): n is string => Boolean(n));
}

export function formatMarinaDateYmd(date: Date): string {
  return toDateString(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/** Bookable if the date matches a selected weekday or is in bookable_dates,
 *  AND is NOT in excluded_dates. */
export function isMarinaCruiseDateBookable(
  date: Date,
  bookingDays: number[] | null | undefined,
  bookableDates: string[] | null | undefined,
  excludedDates?: string[] | null | undefined
): boolean {
  const dateStr = formatMarinaDateYmd(date);
  const excluded = Array.isArray(excludedDates) ? excludedDates : [];

  // Always block excluded dates regardless of days/bookable_dates
  if (excluded.includes(dateStr)) return false;

  const days = Array.isArray(bookingDays)
    ? bookingDays.filter(d => Number.isInteger(d) && d >= 0 && d <= 6)
    : [];
  const dates = Array.isArray(bookableDates) ? bookableDates : [];

  if (dates.includes(dateStr)) return true;
  if (days.length > 0) return days.includes(date.getDay());
  return false;
}

export type MarinaCalendarBounds = { fromMonth: Date; toMonth: Date };

/** Limit month navigation to months that have at least one selectable date. */
export function getMarinaCruiseCalendarBounds(
  bookingDays: number[] | null | undefined,
  bookableDates: string[] | null | undefined,
  now: Date = new Date(),
  excludedDates?: string[] | null | undefined
): MarinaCalendarBounds | null {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const days = Array.isArray(bookingDays)
    ? bookingDays.filter(d => Number.isInteger(d) && d >= 0 && d <= 6)
    : [];
  const dates = Array.isArray(bookableDates) ? bookableDates.filter(Boolean) : [];

  const monthKeys = new Set<number>();

  const considerDate = (date: Date) => {
    const normalized = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    if (normalized.getTime() <= tomorrow.getTime()) return;
    if (!isMarinaCruiseDateBookable(normalized, bookingDays, dates, excludedDates)) return;
    monthKeys.add(normalized.getFullYear() * 12 + normalized.getMonth());
  };

  for (const dateStr of dates) {
    const ymd = dateStr.split('T')[0];
    const [y, m, d] = ymd.split('-').map(Number);
    if (!y || !m || !d) continue;
    considerDate(new Date(y, m - 1, d));
  }

  if (days.length > 0) {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    for (let offset = 0; offset < 24; offset++) {
      const monthStart = new Date(
        start.getFullYear(),
        start.getMonth() + offset,
        1
      );
      const daysInMonth = new Date(
        monthStart.getFullYear(),
        monthStart.getMonth() + 1,
        0
      ).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        considerDate(
          new Date(monthStart.getFullYear(), monthStart.getMonth(), day)
        );
      }
    }
  }

  if (monthKeys.size === 0) return null;

  const sorted = [...monthKeys].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  return {
    fromMonth: new Date(Math.floor(min / 12), min % 12, 1),
    toMonth: new Date(Math.floor(max / 12), max % 12, 1),
  };
}

export function getMarinaCruiseInitialMonth(
  bookingDays: number[] | null | undefined,
  bookableDates: string[] | null | undefined,
  now: Date = new Date(),
  excludedDates?: string[] | null | undefined
): Date | null {
  return (
    getMarinaCruiseCalendarBounds(bookingDays, bookableDates, now, excludedDates)
      ?.fromMonth ?? null
  );
}

export function usesBookingSlots(_categorySlug?: string): boolean {
  return true;
}

export function usesFlexibleDatePackages(_categorySlug?: string): boolean {
  return false;
}

export function supportsListingPageToggle(_categorySlug?: string): boolean {
  return false;
}

export type TourWeekendRangeRule = {
  endYear: number;
  endMonth: number;
  weekdays: readonly number[];
  extraDates?: readonly string[];
  allowTodayBooking?: boolean;
};

/** Per-package booking rules keyed by marina_cruise_dinners.package_id */
export const MARINA_TOUR_WEEKEND_RANGE_BOOKING: Partial<
  Record<string, TourWeekendRangeRule>
> = {};

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
  return MARINA_TOUR_WEEKEND_RANGE_BOOKING[packageId] ?? null;
}

export function hasTourWeekendRangeBooking(
  packageId: string | null | undefined
): boolean {
  return Boolean(getTourWeekendRangeRule(packageId));
}

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

export function shouldSkipTourBookingSlotsForDate(
  date: Date,
  packageId: string | null | undefined
): boolean {
  return (
    hasTourWeekendRangeBooking(packageId) &&
    isDateOnTourWeekendRange(date, packageId)
  );
}

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

export function getTourDefaultWeekendRangeDate(
  packageId: string | null | undefined,
  earliestBookable: Date
): string | null {
  const allowed = getTourWeekendRangeAllowedDates(packageId, earliestBookable);
  return allowed[0] ?? null;
}

export const TOUR_FIXED_BOOKING_DATES: Partial<
  Record<string, readonly string[]>
> = {};

export const TOUR_FIXED_BOOKING_DEFAULT_DATE: Partial<Record<string, string>> =
  {};

export function getTourFixedBookingDates(
  packageId: string | null | undefined
): string[] | null {
  if (!packageId) return null;
  const dates = TOUR_FIXED_BOOKING_DATES[packageId];
  return dates && dates.length > 0 ? [...dates] : null;
}

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
