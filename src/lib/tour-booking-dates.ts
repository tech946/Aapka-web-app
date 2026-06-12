import { format } from 'date-fns';

/** Parse booking_dates JSONB into yyyy-MM-dd strings. */
export function normalizeTourBookingDates(
  dates: unknown
): string[] {
  if (dates == null) return [];

  let parsed: unknown = dates;
  if (typeof dates === 'string') {
    const trimmed = dates.trim();
    if (!trimmed || trimmed === 'null' || trimmed === '[]') return [];
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? [trimmed] : [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  return parsed
    .map(item => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object' && 'value' in item) {
        return String((item as { value: unknown }).value).trim();
      }
      return '';
    })
    .filter(value => /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function hasTourBookingDateWhitelist(
  bookingDates: unknown
): boolean {
  return normalizeTourBookingDates(bookingDates).length > 0;
}

export function isDateOnTourBookingDateList(
  date: Date,
  bookingDates: unknown
): boolean {
  const allowed = normalizeTourBookingDates(bookingDates);
  if (allowed.length === 0) return true;
  return allowed.includes(format(date, 'yyyy-MM-dd'));
}
