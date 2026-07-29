import { format } from 'date-fns';
import { parseDateStringToLocal } from '@/lib/utils';

type TravelDateEntry = { id?: string; value: string } | string;

function normalizeTravelDateStrings(
  travelDates: TravelDateEntry[] | null | undefined
): string[] {
  if (!travelDates || !Array.isArray(travelDates) || travelDates.length === 0) {
    return [];
  }

  return [
    ...new Set(
      travelDates
        .map(d => (typeof d === 'string' ? d : d.value))
        .filter(Boolean)
        .map(dateStr => {
          const parsed = parseDateStringToLocal(dateStr);
          if (!parsed) return null;
          parsed.setHours(0, 0, 0, 0);
          return format(parsed, 'yyyy-MM-dd');
        })
        .filter((d): d is string => d != null)
    ),
  ].sort();
}

/** Minimum days before departure for auto-generated flexible-date calendars (not admin-picked travel dates). */
export const MIN_BOOKING_LEAD_DAYS = 6;

function isFutureOrTodayTravelDate(dateStr: string, today: Date): boolean {
  const parsed = parseDateStringToLocal(dateStr);
  if (!parsed) return false;
  parsed.setHours(0, 0, 0, 0);
  return parsed >= today;
}

/** Offer package travel dates configured in admin — show all that are today or later. */
export function getOfferPackageTravelDates(
  travelDates: TravelDateEntry[] | null | undefined
): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return normalizeTravelDateStrings(travelDates).filter(dateStr =>
    isFutureOrTodayTravelDate(dateStr, today)
  );
}

/** Dates within the booking lead window (today + next N days) — used for flexible-date calendars. */
export function getMinBookableDateFromLeadDays(
  leadDays: number = MIN_BOOKING_LEAD_DAYS
): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + leadDays);
  return minDate;
}

/** Whether a date is bookable given the standard lead-time rule (more than N days from today). */
export function isDateBeyondBookingLeadTime(
  dateStr: string,
  leadDays: number = MIN_BOOKING_LEAD_DAYS
): boolean {
  const parsed = parseDateStringToLocal(dateStr);
  if (!parsed) return false;
  parsed.setHours(0, 0, 0, 0);
  return parsed > getMinBookableDateFromLeadDays(leadDays);
}

export function getOfferPackageTravelDatesStatus(
  travelDates: TravelDateEntry[] | null | undefined
): 'none' | 'all_past' | 'available' {
  const configured = normalizeTravelDateStrings(travelDates);
  if (configured.length === 0) return 'none';
  if (getOfferPackageTravelDates(travelDates).length === 0) return 'all_past';
  return 'available';
}
