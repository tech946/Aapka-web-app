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
        'package_id, package_name, package_description, package_price, package_category_id, package_days, package_nights, travel_dates, booking_slots, end_date, adult_price, child_price, infant_price, solo_traveller_enabled, solo_traveller_price, adult_discount_amount, child_discount_amount, infant_discount_amount, discount_start_date, discount_end_date, status, terms_html, inclusion_html, exclusion_html, overview, holiday_description_html, itinerary, thumbnail_image, created_at'
      )
      .eq('status', 'active');

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }

    // Find package by matching slug
    // Support both old full slugs and new short slugs (with package_id suffix)
    const packageData = allPackages?.find((pkg: any) => {
      // Extract ID suffix from slug (last 5 digits)
      const slugLower = packageSlug.toLowerCase();
      const idSuffixFromSlug = slugLower.split('-').pop() || '';

      // Try matching by ID suffix first (most reliable)
      const pkgIdSuffix = pkg.package_id.replace(/-/g, '').slice(-5);
      if (idSuffixFromSlug === pkgIdSuffix) {
        // Generate expected slug format to verify match
        const firstWord =
          pkg.package_name
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .trim()
            .split(/\s+/)[0] || 'pkg';
        const location = firstWord.substring(0, 10);

        let daysNights = '';
        if (pkg.package_nights && pkg.package_days) {
          daysNights = `${pkg.package_nights}n${pkg.package_days}d`;
        } else if (pkg.package_nights) {
          daysNights = `${pkg.package_nights}n`;
        } else if (pkg.package_days) {
          daysNights = `${pkg.package_days}d`;
        }

        const nameLower = pkg.package_name.toLowerCase();
        let type = '';
        if (nameLower.includes('offer')) {
          type = 'offer';
        } else if (nameLower.includes('tour')) {
          type = 'tour';
        } else if (nameLower.includes('package')) {
          type = 'pkg';
        } else if (nameLower.includes('trip')) {
          type = 'trip';
        }

        const expectedSlug = [location, daysNights, type, pkgIdSuffix]
          .filter(Boolean)
          .join('-');

        // Match if slug contains the same components (flexible matching)
        if (
          slugLower.includes(pkgIdSuffix) &&
          (slugLower.includes(location) ||
            slugLower.startsWith(location.substring(0, 3)))
        ) {
          return true;
        }
      }

      // Also support old full slug format for backward compatibility
      const fullSlug = pkg.package_name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      // Also support direct ID lookup
      return fullSlug === slugLower || pkg.package_id === packageSlug;
    });

    if (!packageData) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    return NextResponse.json({ data: packageData });
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
