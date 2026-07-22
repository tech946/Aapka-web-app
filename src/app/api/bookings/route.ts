import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getPackageIdFromBookingRow(b: Record<string, unknown>): string | null {
  const items = b.cart_items;
  if (Array.isArray(items) && items[0] && typeof items[0] === 'object') {
    const pid = (items[0] as { packageId?: string }).packageId;
    if (pid) return String(pid);
  }
  const pids = b.package_ids;
  if (Array.isArray(pids) && pids[0]) return String(pids[0]);
  return null;
}

// GET - Fetch bookings/payments with pagination and search
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const paymentStatus = searchParams.get('payment_status') || '';
    const bookingStatus = searchParams.get('booking_status') || '';
    /** exclude = regular package payments only; only = limited-time-deal booking fees only */
    const limitedTimeDeal = searchParams.get('limited_time_deal') || '';

    const offset = (page - 1) * limit;

    // Build query
    let query = supabaseAdmin.from('bookings').select('*', { count: 'exact' });

    if (limitedTimeDeal === 'exclude') {
      query = query.is('limited_time_deal_id', null);
    } else if (limitedTimeDeal === 'only') {
      query = query.not('limited_time_deal_id', 'is', null);
    }

    // Apply search filter - search in transaction ID and other text fields
    if (search) {
      // Search in payment_transaction_id and notes
      query = query.or(
        `payment_transaction_id.ilike.%${search}%,notes.ilike.%${search}%,customer_notes.ilike.%${search}%`
      );
    }

    // Apply payment status filter
    if (paymentStatus) {
      query = query.eq('payment_status', paymentStatus);
    }

    // Apply booking status filter
    if (bookingStatus) {
      query = query.eq('booking_status', bookingStatus);
    }

    // Apply pagination and ordering
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch bookings', details: error.message },
        { status: 500 }
      );
    }

    let rows = data || [];

    if (limitedTimeDeal === 'only' && rows.length > 0) {
      const packageIds = new Set<string>();
      for (const b of rows) {
        const id = getPackageIdFromBookingRow(b);
        if (id) packageIds.add(id);
      }
      if (packageIds.size > 0) {
        const { data: pkgs } = await supabaseAdmin
          .from('packages')
          .select('package_id, package_name')
          .in('package_id', Array.from(packageIds));
        const nameById = new Map(
          (pkgs || []).map((p: { package_id: string; package_name: string }) => [
            p.package_id,
            p.package_name,
          ])
        );
        rows = rows.map((b: Record<string, unknown>) => ({
          ...b,
          ltd_package_name:
            nameById.get(getPackageIdFromBookingRow(b) || '') || null,
        }));
      }
    }

    return NextResponse.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Unexpected error occurred' },
      { status: 500 }
    );
  }
}
