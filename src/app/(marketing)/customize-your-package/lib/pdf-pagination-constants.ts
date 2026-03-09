/**
 * PDF Pagination Constants - All heights include margins
 * Copied from CRM for consistent PDF layout with package + addons
 *
 * Page: A4 297mm = 1123px, 60px top + 60px bottom padding = 1003px content area
 * Content order: Airport Pickup → Accommodation → Visa → Itinerary → Airport Dropoff → Total
 */

export const PDF_PAGINATION = {
  /** Page padding top/bottom (px) */
  PAGE_PADDING: 60,
  /** A4 height in px at 96dpi (~297mm) */
  A4_HEIGHT_PX: 1123,
  /** Safety buffer - prevents overflow at page edge (print/PDF variance) */
  HEIGHT_BUFFER: 16,

  // --- Airport (header 44, card ~170) - conservative for badge + transfer card ---
  AIRPORT_HEADER_HEIGHT: 44,
  AIRPORT_CARD_HEIGHT: 170,
  /** Airport Pickup = header + card */
  AIRPORT_PICKUP_HEIGHT: 44 + 170,
  /** Airport Dropoff = same */
  AIRPORT_DROPOFF_HEIGHT: 44 + 170,

  // --- Accommodation ---
  ACCOMMODATION_HEADER_HEIGHT: 44,
  HOTEL_ITEM_HEIGHT: 200,

  // --- Visa ---
  VISA_HEADER_HEIGHT: 44,
  VISA_ITEM_HEIGHT: 102,

  // --- Itinerary: header → activity cards (can be multiple) → next header → more cards ---
  ITINERARY_DAY_HEADER_HEIGHT: 48,
  ITINERARY_DAY_CONTINUATION_HEIGHT: 48,
  /** Activity card: image left, content right - 155px (no margin) */
  ITINERARY_ACTIVITY_HEIGHT: 155,

  // --- Total row: margin-top 24 + padding 16+8 + min-height 56 ---
  TOTAL_ROW_HEIGHT: 110,

  // --- Addon Deals (2-line clamped name + category + activity rows) ---
  ADDON_DEAL_HEADER_HEIGHT: 44,
  ADDON_DEAL_CARD_HEIGHT: 90,

  // --- Addon Private Transfers (2-line clamped name + optional pax rows) ---
  ADDON_TRANSFER_HEADER_HEIGHT: 44,
  ADDON_TRANSFER_CARD_HEIGHT: 75,

  // --- Addon Hotel Services (2-line clamped name + nights badge on next line) ---
  ADDON_HOTEL_SERVICE_HEADER_HEIGHT: 44,
  ADDON_HOTEL_SERVICE_CARD_HEIGHT: 75,
} as const;

/** Usable content height per page (after padding) */
export const AVAILABLE_PAGE_HEIGHT =
  PDF_PAGINATION.A4_HEIGHT_PX -
  PDF_PAGINATION.PAGE_PADDING * 2;
