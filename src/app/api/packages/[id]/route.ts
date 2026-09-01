import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const packageSlug = resolvedParams.id;

    if (!packageSlug) {
      return NextResponse.json(
        { error: 'Package slug is required' },
        { status: 400 }
      );
    }

    // Fetch all active packages and find by slug (name converted to slug)
    // Marketing pages should only see active packages
    const { data: allPackages, error: fetchError } = await supabaseAdmin
      .from('packages')
      .select(
        'package_id, package_name, package_description, package_price, package_category_id, package_days, package_nights, travel_dates, booking_slots, booking_days, date_ranges, pickup_location, end_date, adult_price, child_price, infant_price, solo_traveller_enabled, solo_traveller_price, solo_traveller_only, solo_room_type, with_visa, adult_visa_price, child_visa_price, infant_visa_price, adult_discount_amount, child_discount_amount, infant_discount_amount, discount_start_date, discount_end_date, agent_discount, accept_payment, min_adults, status, terms_html, inclusion_html, exclusion_html, overview, holiday_description_html, itinerary, thumbnail_image, gallery, pdf_url, created_at'
      )
      .eq('status', 'active');

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }

    // Find package by matching slug
    // Support multiple slug formats for flexibility
    const packageData = allPackages?.find((pkg: any) => {
      const slugLower = packageSlug.toLowerCase();
      const pkgIdClean = pkg.package_id.replace(/-/g, '').toLowerCase();
      const pkgIdSuffix5 = pkgIdClean.slice(-5); // Last 5 chars (new format)
      const pkgIdSuffix8 = pkgIdClean.slice(0, 8); // First 8 chars (old format)
      
      // Extract the last segment from slug (potential ID suffix)
      const slugParts = slugLower.split('-');
      const lastSegment = slugParts[slugParts.length - 1] || '';
      
      // Method 1: Direct package_id match
      if (pkg.package_id === packageSlug) {
        return true;
      }
      
      // Method 2: Match by 5-digit ID suffix (new format: trio-4n5d-tour-38930)
      if (lastSegment === pkgIdSuffix5) {
        return true;
      }
      
      // Method 3: Match by 8-char ID prefix (old format from agent dashboard: name-0091ce2c)
      if (lastSegment.length >= 6 && pkgIdClean.startsWith(lastSegment)) {
        return true;
      }
      
      // Method 4: Slug contains the package ID suffix anywhere
      if (slugLower.includes(pkgIdSuffix5) || slugLower.includes(pkgIdSuffix8)) {
        // Verify first word of name matches for additional confidence
        const firstWord = pkg.package_name
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .trim()
          .split(/\s+/)[0] || '';
        
        if (firstWord && slugLower.includes(firstWord.substring(0, 3))) {
          return true;
        }
      }
      
      // Method 5: Full slug from package name (backward compatibility)
      const fullSlug = pkg.package_name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      
      if (fullSlug === slugLower) {
        return true;
      }
      
      // Method 6: Slug starts with full name slug (handles name + id suffix)
      if (slugLower.startsWith(fullSlug)) {
        return true;
      }
      
      return false;
    });

    if (!packageData) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Fetch active deal for this package
    const now = new Date().toISOString();
    const { data: activeDeal } = await supabaseAdmin
      .from('package_deals')
      .select('*')
      .eq('package_id', packageData.package_id)
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .maybeSingle();

    // Include active deal in response
    const packageDataWithDeal = {
      ...packageData,
      active_deal: activeDeal || null,
    };

    return NextResponse.json({ data: packageDataWithDeal });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;

    if (!id) {
      return NextResponse.json(
        { error: 'Package ID is required' },
        { status: 400 }
      );
    }

    // Delete the package by package_id
    const { error } = await supabaseAdmin
      .from('packages')
      .delete()
      .eq('package_id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Package deleted successfully',
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}
