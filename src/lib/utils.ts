import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
