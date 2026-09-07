import { parseDateStringToLocal } from '@/lib/utils';
import { MIN_BOOKING_LEAD_DAYS } from '@/lib/offer-package-dates';
import type { SurchargeMasterEntry } from '@/lib/surcharge-master';

/**
 * Availability rules for "any date" packages (the `flexible-date-packages` category).
 *
 * Any date is bookable except:
 *  - past dates and dates inside the booking lead window
 *  - dates before the package start date, or after its end date
 *  - dates the dashboard marked as sold out
 *  - hotel surcharge dates, plus the configured number of days before each
 *    surcharge starts (default 3 — a 6 Nov–10 Nov surcharge blocks 3 Nov–10 Nov)
 *
 * These rules are shared by the website calendar, the package details page and
 * the server-side cart validation so all three agree.
 */

/** Days before a surcharge range that are also blocked, when the package has no override. */
export const DEFAULT_SURCHARGE_BLOCK_DAYS_BEFORE = 3;

/** Upper bound for the per-package override, to keep a typo from closing the calendar. */
export const MAX_SURCHARGE_BLOCK_DAYS_BEFORE = 90;

export type AnyDateSoldOutRange = {
  fromDate: string;
  toDate: string;
  isSoldOut?: boolean;
};

export type AnyDateBlockReason =
  | 'past'
  | 'lead-time'
  | 'start-date'
  | 'end-date'
  | 'sold-out'
  | 'surcharge'
  | null;

export function normalizeSurchargeBlockDaysBefore(
  value: number | string | null | undefined
): number {
  if (value === null || value === undefined || value === '') {
    return DEFAULT_SURCHARGE_BLOCK_DAYS_BEFORE;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_SURCHARGE_BLOCK_DAYS_BEFORE;
  return Math.min(
    MAX_SURCHARGE_BLOCK_DAYS_BEFORE,
    Math.max(0, Math.floor(parsed))
  );
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toLocalDay(value: string | null | undefined): Date | null {
  const parsed = parseDateStringToLocal(
    typeof value === 'string' ? value.split('T')[0] : value
  );
  return parsed ? startOfLocalDay(parsed) : null;
}

/** Only ranges flagged as sold out matter — pricing ranges are no longer used. */
export function getSoldOutRanges(
  ranges: AnyDateSoldOutRange[] | null | undefined
): AnyDateSoldOutRange[] {
  if (!Array.isArray(ranges)) return [];
  return ranges.filter(r => r && r.isSoldOut === true);
}

export function isDateSoldOut(
  date: Date,
  ranges: AnyDateSoldOutRange[] | null | undefined
): boolean {
  const check = startOfLocalDay(date);
  return getSoldOutRanges(ranges).some(range => {
    const from = toLocalDay(range.fromDate);
    const to = toLocalDay(range.toDate);
    if (!from || !to) return false;
    return check >= from && check <= to;
  });
}

/**
 * The window each surcharge closes off: `blockDaysBefore` days ahead of the
 * surcharge start through the surcharge end (inclusive).
 */
export function getSurchargeBlockedWindows(
  surcharges: SurchargeMasterEntry[] | null | undefined,
  blockDaysBefore: number | string | null | undefined
): Array<{ from: Date; to: Date; surcharge: SurchargeMasterEntry }> {
  if (!Array.isArray(surcharges)) return [];
  const days = normalizeSurchargeBlockDaysBefore(blockDaysBefore);

  const windows: Array<{ from: Date; to: Date; surcharge: SurchargeMasterEntry }> =
    [];
  for (const entry of surcharges) {
    const from = toLocalDay(entry?.from_date);
    const to = toLocalDay(entry?.to_date);
    if (!from || !to) continue;
    const blockedFrom = new Date(from);
    blockedFrom.setDate(blockedFrom.getDate() - days);
    windows.push({ from: blockedFrom, to, surcharge: entry });
  }
  return windows;
}

export function isDateBlockedBySurcharge(
  date: Date,
  surcharges: SurchargeMasterEntry[] | null | undefined,
  blockDaysBefore: number | string | null | undefined
): boolean {
  const check = startOfLocalDay(date);
  return getSurchargeBlockedWindows(surcharges, blockDaysBefore).some(
    w => check >= w.from && check <= w.to
  );
}

export type AnyDateAvailabilityOptions = {
  soldOutRanges?: AnyDateSoldOutRange[] | null;
  surcharges?: SurchargeMasterEntry[] | null;
  surchargeBlockDaysBefore?: number | string | null;
  /** Earliest bookable travel date; dates before it are blocked. */
  startDate?: string | null;
  endDate?: string | null;
  leadDays?: number;
};

/**
 * First date a traveller can book: the booking lead window, pushed forward by
 * the package start date when that is later.
 */
export function getAnyDateEarliestBookable(
  startDate?: string | null,
  leadDays: number = MIN_BOOKING_LEAD_DAYS
): Date {
  const earliest = startOfLocalDay(new Date());
  earliest.setDate(earliest.getDate() + leadDays + 1);

  const start = toLocalDay(startDate);
  return start && start > earliest ? start : earliest;
}

/** Why a date cannot be booked, or null when it is bookable. */
export function getAnyDateBlockReason(
  date: Date,
  {
    soldOutRanges,
    surcharges,
    surchargeBlockDaysBefore,
    startDate,
    endDate,
    leadDays = MIN_BOOKING_LEAD_DAYS,
  }: AnyDateAvailabilityOptions
): AnyDateBlockReason {
  const check = startOfLocalDay(date);
  const today = startOfLocalDay(new Date());

  if (check < today) return 'past';

  const earliest = new Date(today);
  earliest.setDate(earliest.getDate() + leadDays);
  if (check <= earliest) return 'lead-time';

  if (startDate) {
    const start = toLocalDay(startDate);
    if (start && check < start) return 'start-date';
  }

  if (endDate) {
    const end = toLocalDay(endDate);
    if (end && check > end) return 'end-date';
  }

  if (isDateSoldOut(check, soldOutRanges)) return 'sold-out';
  if (isDateBlockedBySurcharge(check, surcharges, surchargeBlockDaysBefore)) {
    return 'surcharge';
  }

  return null;
}

export function isAnyDateBookable(
  date: Date,
  options: AnyDateAvailabilityOptions
): boolean {
  return getAnyDateBlockReason(date, options) === null;
}
