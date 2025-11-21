import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Fetch bookings/payments with pagination and search
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const paymentStatus = searchParams.get('payment_status') || '';
    const bookingStatus = searchParams.get('booking_status') || '';

    const offset = (page - 1) * limit;

    // Build query
    let query = supabaseAdmin.from('bookings').select('*', { count: 'exact' });

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

    return NextResponse.json({
      success: true,
      data: data || [],
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
