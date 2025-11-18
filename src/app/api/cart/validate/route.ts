import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CartItemRequest {
  packageId: string;
  adults: number;
  children: number;
  selectedDate: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items }: { items: CartItemRequest[] } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart items are required' },
        { status: 400 }
      );
    }

    // Fetch all packages at once
    const packageIds = items.map(item => item.packageId);
    const { data: packages, error: fetchError } = await supabaseAdmin
      .from('packages')
      .select(
        'package_id, package_name, package_price, adult_price, child_price, package_nights, package_days, thumbnail_image'
      )
      .in('package_id', packageIds);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }

    // Validate and calculate prices for each cart item
    const validatedItems = items.map(item => {
      const pkg = packages?.find(p => p.package_id === item.packageId);

      if (!pkg) {
        return {
          packageId: item.packageId,
          valid: false,
          error: 'Package not found',
        };
      }

      // Validate adults and children are non-negative
      if (item.adults < 0 || item.children < 0) {
        return {
          packageId: item.packageId,
          valid: false,
          error: 'Invalid person count',
        };
      }

      // Calculate price based on adult_price and child_price if available
      let calculatedPrice = 0;
      if (pkg.adult_price && item.adults > 0) {
        calculatedPrice += pkg.adult_price * item.adults;
      }
      if (pkg.child_price && item.children > 0) {
        calculatedPrice += pkg.child_price * item.children;
      }

      // If no adult/child pricing, use base price
      if (calculatedPrice === 0) {
        calculatedPrice = pkg.package_price || 0;
      }

      return {
        packageId: item.packageId,
        valid: true,
        packageName: pkg.package_name,
        price: calculatedPrice,
        adultPrice: pkg.adult_price,
        childPrice: pkg.child_price,
        basePrice: pkg.package_price,
        nights: pkg.package_nights,
        days: pkg.package_days,
        thumbnailImage: pkg.thumbnail_image,
      };
    });

    // Check if any items are invalid
    const invalidItems = validatedItems.filter(item => !item.valid);
    if (invalidItems.length > 0) {
      return NextResponse.json(
        {
          error: 'Some cart items are invalid',
          invalidItems,
        },
        { status: 400 }
      );
    }

    // At this point, all items are valid, so we can safely access price
    // Calculate total
    const total = validatedItems.reduce(
      (sum, item) => sum + (item.valid ? (item.price ?? 0) : 0),
      0
    );

    return NextResponse.json({
      success: true,
      items: validatedItems,
      total,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Unexpected error' },
      { status: 500 }
    );
  }
}
