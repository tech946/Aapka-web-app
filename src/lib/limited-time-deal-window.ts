/**
 * A limited time deal's start_date/end_date is its live window - the dashboard
 * already derives Active / Upcoming / Expired from it. Public visibility and
 * bookability must agree with that, so the window check lives here instead of
 * being re-derived per route.
 *
 * start_date/end_date are DATE columns, so they arrive as 'YYYY-MM-DD' (older
 * rows written via toISOString() can carry a time part). The business runs on
 * Gulf Standard Time and the server may not, so "today" is resolved in
 * Asia/Dubai and everything is compared as a date-only string - no Date
 * arithmetic, no timezone drift at midnight.
 */

/** Today in Asia/Dubai as 'YYYY-MM-DD'. en-CA formats as ISO. */
export function getDubaiTodayDateString(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dubai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** '2026-08-15T00:00:00+00:00' -> '2026-08-15'; null when unparseable. */
export function toDealDateString(
  value: string | null | undefined
): string | null {
  if (!value) return null;
  const dateOnly = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(dateOnly) ? dateOnly : null;
}

/**
 * Expired once end_date is behind today in Dubai. The end date itself is still
 * live (inclusive), matching the dashboard badge.
 *
 * A missing/unparseable end_date is treated as NOT expired so a bad row stays
 * visible for an admin to correct rather than silently vanishing.
 */
export function isLimitedTimeDealExpired(
  endDate: string | null | undefined,
  today: string = getDubaiTodayDateString()
): boolean {
  const end = toDealDateString(endDate);
  if (!end) return false;
  return end < today;
}
