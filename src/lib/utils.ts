import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely parses a date string to a Date in the user's local timezone.
 *
 * - If the string is in plain date format "YYYY-MM-DD" (like HTML date inputs),
 *   it is treated as a calendar date (year, month, day in local time) to avoid
 *   timezone shifts that can show the previous/next day for users in other countries.
 * - For all other strings it falls back to the native Date parser.
 */
export function parseDateStringToLocal(
  dateString: string | null | undefined
): Date | null {
  if (!dateString || typeof dateString !== 'string') return null;

  // Plain date (from <input type="date"> or stored as "2025-04-03")
  const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1; // JS months are 0-based
    const day = Number(match[3]);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // Fallback for full ISO strings or other formats
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Generates a short, unique slug from package name and ID
 * Format: location-days-nights-type-id (e.g., "dubai-4n5d-offer-38930")
 * Max length: 35 characters to keep full URLs under 70 chars
 *
 * @param packageName - The full package name
 * @param packageId - The package ID (UUID) to ensure uniqueness
 * @param packageDays - Optional number of days
 * @param packageNights - Optional number of nights
 * @returns Short slug (e.g., "dubai-4n5d-offer-38930")
 */
export function generateShortSlug(
  packageName: string,
  packageId: string,
  packageDays?: number | null,
  packageNights?: number | null
): string {
  // Get last 5 digits of package ID (remove hyphens first)
  const idSuffix = packageId.replace(/-/g, '').slice(-5);

  // Extract first word (usually location) from package name
  const firstWord =
    packageName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special chars
      .trim()
      .split(/\s+/)[0] || 'pkg';

  // Limit first word to 10 characters
  const location = firstWord.substring(0, 10);

  // Build days/nights part (e.g., "4n5d" for 4 nights 5 days)
  let daysNights = '';
  if (packageNights && packageDays) {
    daysNights = `${packageNights}n${packageDays}d`;
  } else if (packageNights) {
    daysNights = `${packageNights}n`;
  } else if (packageDays) {
    daysNights = `${packageDays}d`;
  }

  // Extract type/keyword from package name (look for common words)
  const nameLower = packageName.toLowerCase();
  let type = '';
  if (nameLower.includes('offer')) {
    type = 'offer';
  } else if (nameLower.includes('tour')) {
    type = 'tour';
  } else if (nameLower.includes('package')) {
    type = 'pkg';
  } else if (nameLower.includes('trip')) {
    type = 'trip';
  }

  // Build slug parts
  const parts: string[] = [location];

  if (daysNights) {
    parts.push(daysNights);
  }

  if (type) {
    parts.push(type);
  }

  parts.push(idSuffix);

  const fullSlug = parts.join('-');

  // Ensure total length is under 35 characters
  if (fullSlug.length > 35) {
    // If too long, remove type first
    if (type && parts.length > 3) {
      const withoutType = [location, daysNights, idSuffix]
        .filter(Boolean)
        .join('-');
      if (withoutType.length <= 35) {
        return withoutType;
      }
    }
    // If still too long, truncate location
    const maxLocationLength =
      35 -
      (daysNights ? daysNights.length + 1 : 0) -
      (type ? type.length + 1 : 0) -
      idSuffix.length -
      2; // -2 for hyphens
    const truncatedLocation = location.substring(
      0,
      Math.max(3, maxLocationLength)
    );
    return [truncatedLocation, daysNights, type, idSuffix]
      .filter(Boolean)
      .join('-')
      .substring(0, 35);
  }

  return fullSlug;
}

/**
 * Gets the earliest available date month from date ranges for flexible date packages.
 * Considers the 6-day minimum booking rule and returns the month that should be shown first.
 * 
 * @param dateRanges - Array of date ranges with fromDate and toDate
 * @returns Date object representing the first month with available dates, or current month if no ranges
 */
export function getEarliestAvailableDateMonth(
  dateRanges?: Array<{ fromDate: string; toDate: string; isSoldOut?: boolean }> | null
): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sixDaysFromNow = new Date(today);
  sixDaysFromNow.setDate(sixDaysFromNow.getDate() + 6);

  // If no date ranges, return current month
  if (!dateRanges || dateRanges.length === 0) {
    return new Date();
  }

  let earliestDate: Date | null = null;

  // Find the earliest fromDate from all non-sold-out ranges
  // Only consider dates that are at least 6 days from today
  for (const range of dateRanges) {
    if (range.isSoldOut) continue; // Skip sold out ranges
    
    const fromDate = parseDateStringToLocal(range.fromDate);
    if (!fromDate) continue;
    
    fromDate.setHours(0, 0, 0, 0);
    
    // Only consider dates that are at least 6 days from today
    // If the range starts before the 6-day window, check if the range extends beyond it
    if (fromDate <= sixDaysFromNow) {
      // Check if the range extends beyond the 6-day window
      const toDate = parseDateStringToLocal(range.toDate);
      if (toDate && toDate > sixDaysFromNow) {
        // Range extends beyond 6 days, so the first available date is 6 days from now
        const availableFromDate = sixDaysFromNow;
        if (!earliestDate || availableFromDate < earliestDate) {
          earliestDate = availableFromDate;
        }
      }
      // If range doesn't extend beyond 6 days, skip it
    } else {
      // Range starts after 6 days, so use the fromDate
      if (!earliestDate || fromDate < earliestDate) {
        earliestDate = fromDate;
      }
    }
  }

  // If we found an earliest date, return its month (first day of that month)
  if (earliestDate) {
    return new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
  }

  // Fallback to current month
  return new Date();
}
