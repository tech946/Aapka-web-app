import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * Seats for one cart line (LTD). Matches create-booking normalization: solo = 1 person.
 * Treat string "true" from JSON as solo (some clients/DB round-trips booleans as strings).
 */
export function countLtdSeatsInCartItem(item: unknown): number {
  if (!item || typeof item !== 'object') return 0;
  const i = item as Record<string, unknown>;
  const solo =
    i.isSoloTraveller === true ||
    String(i.isSoloTraveller).toLowerCase() === 'true';
  if (solo) return 1;
  const adults = Number(i.adults) || 0;
  const children = Number(i.children) || 0;
  const infants = Number(i.infants) || 0;
  return adults + children + infants;
}

/** yyyy-MM-dd from cart selectedDate (date-only or ISO). Supports snake_case from DB/CRM. */
export function ltdTravelDateKey(selectedDate: unknown): string | null {
  if (selectedDate == null) return null;
  const s = String(selectedDate).trim();
  if (!s) return null;
  const head = s.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(head)) return head;
  return head;
}

/** Travel date from a cart line (camelCase or snake_case). */
export function ltdCartItemTravelDateKey(item: Record<string, unknown>): string | null {
  return ltdTravelDateKey(item.selectedDate ?? item.selected_date);
}

/** Never reduce seats for these payment states (even if other fields look “filled”). */
const PAYMENT_STATUS_EXCLUDE = new Set([
  'pending',
  'failed',
  'refunded',
  'cancelled',
  'abandoned',
  'processing',
  'initiated',
  'unpaid',
  'partial',
  'incomplete',
  'void',
]);

/**
 * Whether this LTD booking row should reduce seat availability.
 * DB columns (public.bookings): payment_status, payment_transaction_id, booking_status,
 * payment_done (set to 'full' | 'half' on successful CCAvenue/HDFC callback only).
 *
 * Rules:
 * - payment_status must be "completed" (case-insensitive); never count pending/failed/etc.
 * - payment_transaction_id must be non-empty (pending LTD rows from create-booking do not have it).
 * - booking_status must not be cancelled.
 * - If payment_done is present, it must be a successful gateway value ('full' | 'half').
 *   Rows with payment_done explicitly still pending/failed are excluded (stale/corrupt data).
 */
export function shouldCountLtdBookingForAvailability(booking: {
  payment_status?: string | null;
  payment_transaction_id?: string | null;
  booking_status?: string | null;
  payment_done?: string | null;
}): boolean {
  const ps = String(booking.payment_status ?? '').trim().toLowerCase();
  if (!ps || PAYMENT_STATUS_EXCLUDE.has(ps)) return false;
  if (ps.includes('pending')) return false;
  if (ps !== 'completed') return false;

  const tid = String(booking.payment_transaction_id ?? '').trim();
  if (!tid) return false;

  const bs = String(booking.booking_status ?? '').trim().toLowerCase();
  if (bs === 'cancelled' || bs === 'canceled') return false;

  const pd = String(booking.payment_done ?? '').trim().toLowerCase();
  if (pd) {
    const PAID_DONE = new Set(['full', 'half']);
    if (pd.includes('pending') || pd === 'failed' || pd === 'none') return false;
    if (!PAID_DONE.has(pd)) return false;
  }

  return true;
}

/**
 * Per travel date (yyyy-MM-dd), total seats taken by **fully paid** LTD bookings only.
 * Pending checkouts (no txn id / status contains pending), failed, refunded, and cancelled do not reduce availability.
 */
export async function getLtdOccupiedSeatsByDate(
  dealId: string
): Promise<Map<string, number>> {
  const map = new Map<string, number>();

  try {
    // Only load rows that can possibly count: pending/failed never match these filters.
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('cart_items, payment_status, payment_transaction_id, booking_status, payment_done')
      .eq('limited_time_deal_id', dealId)
      .ilike('payment_status', 'completed')
      .not('payment_transaction_id', 'is', null)
      .neq('payment_transaction_id', '');

    if (error) {
      console.error('[LTD] Occupied seats query error:', error.message);
      return map;
    }
    if (!bookings) return map;

    for (const booking of bookings) {
      if (!shouldCountLtdBookingForAvailability(booking)) continue;

      const cartItems = booking.cart_items;
      if (!Array.isArray(cartItems)) continue;

      for (const item of cartItems) {
        if (!item || typeof item !== 'object') continue;
        const raw = item as Record<string, unknown>;
        const dateStr = ltdCartItemTravelDateKey(raw);
        if (!dateStr) continue;
        const total = countLtdSeatsInCartItem(item);
        if (total <= 0) continue;
        map.set(dateStr, (map.get(dateStr) || 0) + total);
      }
    }
  } catch (e) {
    console.error('[LTD] Error computing occupied seats:', e);
  }

  return map;
}
