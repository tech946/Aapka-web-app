import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getDubaiTodayDateString } from '@/lib/limited-time-deal-window';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: List limited time deals (with optional include_expired for dashboard)
//
// NOTE: this used to call syncActivePackageDealsToLimitedTimeDeals() to backfill
// rows from active Deals of the Day. That made a read mutate the table, which
// broke deletion outright: the dashboard refetches right after a DELETE, the
// sync saw an active package_deal with no limited_time_deals row, and recreated
// the row the admin had just removed. It also inserted rows for *every* other
// active package deal on each fetch, so creating one deal appeared to create
// several. Deals of the Day are still linked at creation time by
// ensureLimitedTimeDealForPackageDeal() in the package-deals route.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeExpired = searchParams.get('include_expired') === 'true';

    let query = supabaseAdmin
      .from('limited_time_deals')
      .select(
        `
        id,
        offer_package_id,
        start_date,
        end_date,
        booking_fee_aed,
        max_bookings_per_day,
        is_active,
        created_at,
        updated_at,
        packages (
          package_id,
          package_name,
          package_description,
          package_days,
          package_nights,
          adult_price,
          child_price,
          infant_price,
          solo_traveller_price,
          solo_traveller_enabled,
          agent_discount,
          thumbnail_image,
          status,
          min_adults,
          with_visa,
          adult_visa_price,
          child_visa_price,
          infant_visa_price
        )
      `
      )
      .order('created_at', { ascending: false });

    /* include_expired=true (dashboard): every deal, so an admin can see and edit
       Expired / Upcoming / Inactive rows.

       include_expired=false (public marketing pages): only deals that are still
       live. is_active alone is NOT enough - it is the admin's manual on/off
       switch and says nothing about the date window, which is why a deal whose
       end_date had already passed kept rendering on /limited-time-deals with a
       "Limited Time" badge while the dashboard showed it as Expired. end_date is
       inclusive, so a deal ending today is still live. */
    if (!includeExpired) {
      query = query
        .eq('is_active', true)
        .gte('end_date', getDubaiTodayDateString());
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Flatten packages relation; hide deals whose package is missing or inactive on public pages
    const mapped = (data || [])
      .map((d: any) => ({
        ...d,
        package: d.packages || null,
        packages: undefined,
      }))
      .filter((d: any) => {
        if (includeExpired) return true;
        return d.package && d.package.status === 'active';
      });

    return NextResponse.json({ success: true, data: mapped });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}

// POST: Create limited time deal
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const offerPackageId = (body?.offer_package_id || '').trim();
    const startDate = (body?.start_date || '').trim();
    const endDate = (body?.end_date || '').trim();
    const bookingFeeAed =
      body?.booking_fee_aed !== undefined && body?.booking_fee_aed !== null
        ? Number(body.booking_fee_aed)
        : 100;
    const maxBookingsPerDay =
      body?.max_bookings_per_day !== undefined &&
      body?.max_bookings_per_day !== null
        ? Number(body.max_bookings_per_day)
        : 48;
    const isActive = body?.is_active !== false;

    if (!offerPackageId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'offer_package_id, start_date, and end_date are required' },
        { status: 400 }
      );
    }

    // One limited time deal per offer package: the linkage helpers
    // (ensureLimitedTimeDealForPackageDeal / setLimitedTimeDealActiveForPackage)
    // both key off offer_package_id, so duplicates make those ambiguous.
    const { data: duplicate } = await supabaseAdmin
      .from('limited_time_deals')
      .select('id')
      .eq('offer_package_id', offerPackageId)
      .limit(1);

    if (duplicate && duplicate.length > 0) {
      return NextResponse.json(
        {
          error:
            'A limited time deal already exists for this offer package. Edit or delete the existing deal instead.',
        },
        { status: 409 }
      );
    }

    const insertData = {
      offer_package_id: offerPackageId,
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      booking_fee_aed: Math.max(0, bookingFeeAed),
      max_bookings_per_day: Math.max(1, Math.min(999, maxBookingsPerDay)),
      is_active: isActive,
    };

    const { data, error } = await supabaseAdmin
      .from('limited_time_deals')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}
