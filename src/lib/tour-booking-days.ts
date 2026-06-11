/** Weekday numbers match JavaScript Date.getDay(): 0 = Sunday .. 6 = Saturday */
export const TOUR_WEEKDAYS = [
  { value: 0, label: 'Sunday', short: 'Su' },
  { value: 1, label: 'Monday', short: 'Mo' },
  { value: 2, label: 'Tuesday', short: 'Tu' },
  { value: 3, label: 'Wednesday', short: 'We' },
  { value: 4, label: 'Thursday', short: 'Th' },
  { value: 5, label: 'Friday', short: 'Fr' },
  { value: 6, label: 'Saturday', short: 'Sa' },
] as const;

export const ALL_TOUR_BOOKING_DAYS = TOUR_WEEKDAYS.map(d => d.value);

export function normalizeTourBookingDays(
  days: number[] | null | undefined
): number[] {
  if (!days || !Array.isArray(days) || days.length === 0) {
    return ALL_TOUR_BOOKING_DAYS;
  }
  return days.filter(d => Number.isInteger(d) && d >= 0 && d <= 6);
}

export function isDateOnTourBookingDay(
  date: Date,
  bookingDays: number[] | null | undefined
): boolean {
  const allowed = normalizeTourBookingDays(bookingDays);
  return allowed.includes(date.getDay());
}
