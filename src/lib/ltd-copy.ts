/**
 * LTD pages: CMS copy — normalize "single occupancy" to double/triple wording.
 * Other occupancy phrases can still be normalized to "per person" if desired.
 */
export function replaceLtdOccupancyPhrases(text: string): string {
  if (!text) return text;
  return text
    .replace(/\bdouble\s*\/\s*triple\s+occupancy\b/gi, 'per person')
    .replace(/\bdouble\s+occupancy\b/gi, 'per person')
    .replace(/\btriple\s+occupancy\b/gi, 'per person')
    .replace(/\bsingle\s+occupancy\b/gi, 'double/Triple occupancy');
}

/** CCAvenue checkout: 3% platform fee on booking-fee subtotal (LTD only). */
export const LTD_CHECKOUT_SURCHARGE_RATE = 0.03;

export function computeLtdPayableTotal(bookingFeeSubtotal: number): {
  subtotal: number;
  surcharge: number;
  total: number;
} {
  const subtotal = Math.round(Number(bookingFeeSubtotal) * 100) / 100;
  const rawTotal = subtotal * (1 + LTD_CHECKOUT_SURCHARGE_RATE);
  const total = Math.round(rawTotal * 100) / 100;
  const surcharge = Math.round((total - subtotal) * 100) / 100;
  return { subtotal, surcharge, total };
}
