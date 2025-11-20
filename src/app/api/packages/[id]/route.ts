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
        'package_id, package_name, package_description, package_price, package_category_id, package_days, package_nights, travel_dates, adult_price, child_price, infant_price, status, terms_html, inclusion_html, exclusion_html, overview, holiday_description_html, itinerary, thumbnail_image, created_at'
      )
      .eq('status', 'active');

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }

    // Find package by matching slug (convert package name to slug format)
    const packageData = allPackages?.find((pkg: any) => {
      const packageNameSlug = pkg.package_name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      return packageNameSlug === packageSlug.toLowerCase();
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
