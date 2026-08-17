import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { format, parseISO } from 'date-fns';
import { getLtdOccupiedSeatsByDate } from '@/lib/ltd-occupied-seats';
import { getOfferPackageTravelDates } from '@/lib/offer-package-dates';
import { getDubaiTodayDateString } from '@/lib/limited-time-deal-window';

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
      .select('start_date, end_date, max_bookings_per_day, offer_package_id')
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json(
        { error: 'Limited time deal not found' },
        { status: 404 }
      );
    }

    const { data: pkg } = await supabaseAdmin
      .from('packages')
      .select('travel_dates')
      .eq('package_id', deal.offer_package_id)
      .maybeSingle();

    const occupiedMap = await getLtdOccupiedSeatsByDate(dealId);
    const maxPerDay = Number(deal.max_bookings_per_day) || 48;

    let dateStrings = getOfferPackageTravelDates(
      pkg?.travel_dates as Array<{ id?: string; value: string } | string> | null
    );

    // Fallback to deal date range if package has no travel dates configured.
    // getOfferPackageTravelDates() already drops past dates, so do the same here:
    // start from today when the window opened earlier, otherwise the calendar
    // offers dates that have already been and gone as bookable.
    if (dateStrings.length === 0) {
      const startStr = String(deal.start_date).split('T')[0];
      const endStr = String(deal.end_date).split('T')[0];
      const todayStr = getDubaiTodayDateString();
      const startDate = parseISO(startStr > todayStr ? startStr : todayStr);
      const endDate = parseISO(endStr);
      const current = new Date(startDate);
      while (current <= endDate) {
        dateStrings.push(format(current, 'yyyy-MM-dd'));
        current.setDate(current.getDate() + 1);
      }
    }

    const result: Record<string, { available: number; isSoldOut: boolean }> = {};

    for (const dateStr of dateStrings) {
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
