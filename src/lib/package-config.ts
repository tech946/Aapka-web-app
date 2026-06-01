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
