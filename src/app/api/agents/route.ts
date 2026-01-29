import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Fetch agents with pagination and search
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const searchQuery = searchParams.get('q') || search; // Support both 'search' and 'q' params

    const offset = (page - 1) * limit;

    // Build query - join with subscriptions to get subscription details
    let query = supabaseAdmin
      .from('agents')
      .select(
        `
        id,
        user_id,
        email,
        full_name,
        resident_country,
        mobile_number,
        subscription_id,
        is_active,
        created_at,
        updated_at,
        subscriptions (
          id,
          subscription_type,
          amount_paid,
          currency,
          payment_status,
          start_date,
          end_date,
          is_active
        )
      `,
        { count: 'exact' }
      );

    // Apply search filter - search in email and mobile_number
    if (searchQuery) {
      query = query.or(
        `email.ilike.%${searchQuery}%,mobile_number.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`
      );
    }

    // Apply pagination and ordering
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[AGENTS API] Error fetching agents:', error);
      return NextResponse.json(
        { error: 'Failed to fetch agents', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: count || 0,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('[AGENTS API] Unexpected error:', error);
    return NextResponse.json(
      { error: error?.message || 'Unexpected error occurred' },
      { status: 500 }
    );
  }
}
