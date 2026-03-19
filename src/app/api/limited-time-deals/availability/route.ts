import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper: Get occupied seats per date for a limited time deal
async function getOccupiedSeatsForLimitedTimeDeal(
  dealId: string
): Promise<Map<string, number>> {
  const map = new Map<string, number>();

  try {
    const { data: bookings, error } = await supabaseAdmin
      .from('bookings')
      .select('cart_items')
      .eq('payment_status', 'completed')
      .eq('limited_time_deal_id', dealId);

    if (error || !bookings) return map;

    for (const booking of bookings) {
      const cartItems = booking.cart_items;
      if (!Array.isArray(cartItems)) continue;

      for (const item of cartItems) {
        if (!item?.selectedDate) continue;
        const dateStr = String(item.selectedDate).split('T')[0];
        const adults = Number(item.adults) || 0;
        const children = Number(item.children) || 0;
        const infants = Number(item.infants) || 0;
        const total =
          item.isSoloTraveller ? 1 : adults + children + infants;
        const current = map.get(dateStr) || 0;
        map.set(dateStr, current + total);
      }
    }
  } catch (e) {
    console.error('Error getting occupied seats:', e);
  }

  return map;
}

// GET: Get seat availability for a limited time deal
// ?deal_id=uuid
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dealId = searchParams.get('deal_id');

    if (!dealId) {
      return NextResponse.json(
        { error: 'deal_id is required' },
        { status: 400 }
      );
    }

    // Get deal to read date range and max_bookings_per_day
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('limited_time_deals')
      .select('start_date, end_date, max_bookings_per_day')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json(
        { error: 'Limited time deal not found' },
        { status: 404 }
      );
    }

    const occupiedMap = await getOccupiedSeatsForLimitedTimeDeal(dealId);
    const maxPerDay = Number(deal.max_bookings_per_day) || 46;

    const startDate = new Date(deal.start_date);
    const endDate = new Date(deal.end_date);
    const result: Record<string, { available: number; isSoldOut: boolean }> = {};

    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const occupied = occupiedMap.get(dateStr) || 0;
      const available = Math.max(0, maxPerDay - occupied);
      const isSoldOut = available <= 0;
      result[dateStr] = { available, isSoldOut };
      current.setDate(current.getDate() + 1);
    }

    return NextResponse.json({
      success: true,
      data: result,
      maxBookingsPerDay: maxPerDay,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}
