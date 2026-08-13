import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET: Get single limited time deal with package
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    if (!id) {
      return NextResponse.json(
        { error: 'Deal id is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('limited_time_deals')
      .select(
        `
        *,
        packages:offer_package_id (
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
          with_visa,
          adult_visa_price,
          child_visa_price,
          infant_visa_price,
          thumbnail_image,
          gallery,
          status,
          min_adults,
          terms_html,
          inclusion_html,
          exclusion_html,
          overview,
          holiday_description_html,
          itinerary
        )
      `
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Limited time deal not found' },
        { status: 404 }
      );
    }

    const mapped = {
      ...data,
      package: data.packages || null,
      packages: undefined,
    };

    return NextResponse.json({ success: true, data: mapped });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}

// PUT: Update limited time deal
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    const body = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Deal id is required' },
        { status: 400 }
      );
    }

    const updates: Record<string, any> = {};

    if (body?.start_date !== undefined) {
      updates.start_date = new Date(body.start_date).toISOString();
    }
    if (body?.end_date !== undefined) {
      updates.end_date = new Date(body.end_date).toISOString();
    }
    if (body?.booking_fee_aed !== undefined) {
      updates.booking_fee_aed = Math.max(0, Number(body.booking_fee_aed));
    }
    if (body?.max_bookings_per_day !== undefined) {
      updates.max_bookings_per_day = Math.max(
        1,
        Math.min(999, Number(body.max_bookings_per_day))
      );
    }
    if (body?.is_active !== undefined) {
      updates.is_active = Boolean(body.is_active);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('limited_time_deals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete limited time deal
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    if (!id) {
      return NextResponse.json(
        { error: 'Deal id is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('limited_time_deals')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Limited time deal deleted successfully',
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}
