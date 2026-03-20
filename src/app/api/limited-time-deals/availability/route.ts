import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { eachDayOfInterval, format, parseISO } from 'date-fns';
import { getLtdOccupiedSeatsByDate } from '@/lib/ltd-occupied-seats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: Get seat availability for a limited time deal
// ?deal_id=uuid
// Remaining seats = max_bookings_per_day − seats from **completed** payments only (pending/cancelled/failed excluded).
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

    const occupiedMap = await getLtdOccupiedSeatsByDate(dealId);
    const maxPerDay = Number(deal.max_bookings_per_day) || 48;

    const startStr = String(deal.start_date).split('T')[0];
    const endStr = String(deal.end_date).split('T')[0];
    const startDate = parseISO(startStr);
    const endDate = parseISO(endStr);

    const result: Record<string, { available: number; isSoldOut: boolean }> = {};

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    for (const day of days) {
      const dateStr = format(day, 'yyyy-MM-dd');
      const occupied = occupiedMap.get(dateStr) || 0;
      const available = Math.max(0, maxPerDay - occupied);
      const isSoldOut = available <= 0;
      result[dateStr] = { available, isSoldOut };
    }

    return NextResponse.json({
      success: true,
      data: result,
      maxBookingsPerDay: maxPerDay,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to fetch availability';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
