import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { setLimitedTimeDealActiveForPackage } from '@/lib/limited-time-deals-sync';

export const dynamic = 'force-dynamic';

// GET - Fetch a specific deal by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const dealId = resolvedParams.id;

    if (!dealId) {
      return NextResponse.json(
        { error: 'Deal ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('package_deals')
      .select('*, packages(package_id, package_name, thumbnail_image)')
      .eq('id', dealId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}

// PUT - Update a deal
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const dealId = resolvedParams.id;
    const body = await req.json();

    if (!dealId) {
      return NextResponse.json(
        { error: 'Deal ID is required' },
        { status: 400 }
      );
    }

    // Check if deal exists
    const { data: existingDeal, error: fetchError } = await supabaseAdmin
      .from('package_deals')
      .select('package_id')
      .eq('id', dealId)
      .single();

    if (fetchError || !existingDeal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    if (body?.start_date !== undefined) {
      updateData.start_date = body.start_date;
    }
    if (body?.end_date !== undefined) {
      updateData.end_date = body.end_date;
    }
    if (body?.is_active !== undefined) {
      updateData.is_active = body.is_active;
    }

    // Update deal prices
    if (body?.deal_adult_price !== undefined) {
      updateData.deal_adult_price =
        body.deal_adult_price === null || body.deal_adult_price === ''
          ? null
          : Number(body.deal_adult_price);
    }
    if (body?.deal_child_price !== undefined) {
      updateData.deal_child_price =
        body.deal_child_price === null || body.deal_child_price === ''
          ? null
          : Number(body.deal_child_price);
    }
    if (body?.deal_infant_price !== undefined) {
      updateData.deal_infant_price =
        body.deal_infant_price === null || body.deal_infant_price === ''
          ? null
          : Number(body.deal_infant_price);
    }
    if (body?.deal_solo_traveller_price !== undefined) {
      updateData.deal_solo_traveller_price =
        body.deal_solo_traveller_price === null ||
        body.deal_solo_traveller_price === ''
          ? null
          : Number(body.deal_solo_traveller_price);
    }

    // Validate dates if both are being updated
    if (updateData.start_date && updateData.end_date) {
      if (new Date(updateData.end_date) <= new Date(updateData.start_date)) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        );
      }
    }

    // Update the deal
    const { data, error } = await supabaseAdmin
      .from('package_deals')
      .update(updateData)
      .eq('id', dealId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (body?.is_active !== undefined) {
      await setLimitedTimeDealActiveForPackage(
        existingDeal.package_id,
        Boolean(body.is_active)
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a deal
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const dealId = resolvedParams.id;

    if (!dealId) {
      return NextResponse.json(
        { error: 'Deal ID is required' },
        { status: 400 }
      );
    }

    const { data: dealBeforeDelete } = await supabaseAdmin
      .from('package_deals')
      .select('package_id')
      .eq('id', dealId)
      .maybeSingle();

    const { error } = await supabaseAdmin
      .from('package_deals')
      .delete()
      .eq('id', dealId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (dealBeforeDelete?.package_id) {
      await setLimitedTimeDealActiveForPackage(dealBeforeDelete.package_id, false);
    }

    return NextResponse.json({
      success: true,
      message: 'Deal deleted successfully',
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}
