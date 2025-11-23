/**
 * Configuration for package categories
 * This file defines which categories use booking slots (unavailable dates) vs travel dates
 *
 * To add more categories that use booking slots, add their slugs to the array below
 */
export const BOOKING_SLOTS_CATEGORIES = ['uae-tours'] as const;

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
