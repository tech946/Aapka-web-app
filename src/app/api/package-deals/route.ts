import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// GET - Fetch all deals or deals for a specific package
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const packageId = searchParams.get('package_id');
    const activeOnly = searchParams.get('active_only') === 'true';
    const includeExpired = searchParams.get('include_expired') !== 'false';

    let query = supabaseAdmin
      .from('package_deals')
      .select('*, packages(package_id, package_name, thumbnail_image)')
      .order('created_at', { ascending: false });

    // Filter by package if provided
    if (packageId) {
      query = query.eq('package_id', packageId);
    }

    // Filter active deals only
    if (activeOnly) {
      const now = new Date().toISOString();
      query = query
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now);
    } else if (!includeExpired) {
      // Exclude expired deals (but include future deals)
      const now = new Date().toISOString();
      query = query.gte('end_date', now);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: data ?? [],
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}

// POST - Create a new deal
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const packageId = (body?.package_id || '').trim();
    const startDate = body?.start_date;
    const endDate = body?.end_date;
    const isActive = body?.is_active !== undefined ? body.is_active : true;

    // Validate required fields
    if (!packageId) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // Validate dates
    if (new Date(endDate) <= new Date(startDate)) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Fetch original package prices
    const { data: packageData, error: packageError } = await supabaseAdmin
      .from('packages')
      .select('adult_price, child_price, infant_price, solo_traveller_price')
      .eq('package_id', packageId)
      .single();

    if (packageError || !packageData) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Prepare deal data
    const dealData: any = {
      package_id: packageId,
      start_date: startDate,
      end_date: endDate,
      is_active: isActive,
      // Original prices snapshot
      original_adult_price: packageData.adult_price,
      original_child_price: packageData.child_price,
      original_infant_price: packageData.infant_price,
      original_solo_traveller_price: packageData.solo_traveller_price,
    };

    // Deal prices (optional - if not provided, will be null)
    if (body?.deal_adult_price !== undefined) {
      dealData.deal_adult_price =
        body.deal_adult_price === null || body.deal_adult_price === ''
          ? null
          : Number(body.deal_adult_price);
    }
    if (body?.deal_child_price !== undefined) {
      dealData.deal_child_price =
        body.deal_child_price === null || body.deal_child_price === ''
          ? null
          : Number(body.deal_child_price);
    }
    if (body?.deal_infant_price !== undefined) {
      dealData.deal_infant_price =
        body.deal_infant_price === null || body.deal_infant_price === ''
          ? null
          : Number(body.deal_infant_price);
    }
    if (body?.deal_solo_traveller_price !== undefined) {
      dealData.deal_solo_traveller_price =
        body.deal_solo_traveller_price === null ||
        body.deal_solo_traveller_price === ''
          ? null
          : Number(body.deal_solo_traveller_price);
    }

    // Check if there's already an active deal for this package
    const now = new Date().toISOString();
    const { data: existingDeal } = await supabaseAdmin
      .from('package_deals')
      .select('id')
      .eq('package_id', packageId)
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .maybeSingle();

    if (existingDeal) {
      return NextResponse.json(
        {
          error:
            'An active deal already exists for this package. Please update or deactivate the existing deal first.',
        },
        { status: 400 }
      );
    }

    // Insert the deal
    const { data, error } = await supabaseAdmin
      .from('package_deals')
      .insert(dealData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
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
