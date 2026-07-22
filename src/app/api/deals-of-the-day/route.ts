import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

// GET - Fetch active deals with full package information for homepage
export async function GET(req: NextRequest) {
  try {
    const now = new Date().toISOString();
    
    // Fetch active deals with full package information
    const { data: dealsData, error: dealsError } = await supabaseAdmin
      .from('package_deals')
      .select(`
        *,
        packages!inner(
          package_id,
          package_name,
          package_description,
          package_days,
          package_nights,
          adult_price,
          child_price,
          infant_price,
          solo_traveller_price,
          itinerary,
          thumbnail_image,
          gallery,
          package_categories!inner(name)
        )
      `)
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .order('created_at', { ascending: false });

    if (dealsError) {
      return NextResponse.json({ error: dealsError.message }, { status: 400 });
    }

    // Transform data to include package info
    const dealsWithPackages = (dealsData || []).map((deal: any) => {
      const pkg = deal.packages;
      return {
        id: deal.id,
        package_id: deal.package_id,
        deal_adult_price: deal.deal_adult_price,
        deal_child_price: deal.deal_child_price,
        deal_infant_price: deal.deal_infant_price,
        deal_solo_traveller_price: deal.deal_solo_traveller_price,
        original_adult_price: deal.original_adult_price,
        original_child_price: deal.original_child_price,
        original_infant_price: deal.original_infant_price,
        original_solo_traveller_price: deal.original_solo_traveller_price,
        start_date: deal.start_date,
        end_date: deal.end_date,
        package: {
          package_id: pkg.package_id,
          package_name: pkg.package_name,
          package_description: pkg.package_description,
          package_days: pkg.package_days,
          package_nights: pkg.package_nights,
          adult_price: pkg.adult_price,
          child_price: pkg.child_price,
          infant_price: pkg.infant_price,
          solo_traveller_price: pkg.solo_traveller_price,
          itinerary: pkg.itinerary,
          thumbnail_image: pkg.thumbnail_image,
          gallery: pkg.gallery,
          category_name: pkg.package_categories?.name || '',
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: dealsWithPackages,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}
