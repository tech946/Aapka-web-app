import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CartItemRequest {
  packageId: string;
  adults: number;
  children: number;
  infants: number;
  selectedDate: string | null;
   isSoloTraveller?: boolean;
}

// Helper function to check if discount is active
function isDiscountActive(pkg: any): boolean {
  if (!pkg.discount_start_date || !pkg.discount_end_date) return false;
  
  const hasDiscount = (pkg.adult_discount_amount && pkg.adult_discount_amount > 0) ||
    (pkg.child_discount_amount && pkg.child_discount_amount > 0) ||
    (pkg.infant_discount_amount && pkg.infant_discount_amount > 0);
  
  if (!hasDiscount) return false;
  
  const now = new Date();
  const startDate = new Date(pkg.discount_start_date);
  const endDate = new Date(pkg.discount_end_date);
  endDate.setHours(23, 59, 59, 999);
  
  return now >= startDate && now <= endDate;
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

    // Fetch all packages at once (including discount fields)
    const packageIds = items.map(item => item.packageId);
    const { data: packages, error: fetchError } = await supabaseAdmin
      .from('packages')
      .select(
        'package_id, package_name, package_price, adult_price, child_price, infant_price, solo_traveller_enabled, solo_traveller_price, package_nights, package_days, thumbnail_image, adult_discount_amount, child_discount_amount, infant_discount_amount, discount_start_date, discount_end_date'
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

      // Validate adults, children, and infants are non-negative
      if (item.adults < 0 || item.children < 0 || item.infants < 0) {
        return {
          packageId: item.packageId,
          valid: false,
          error: 'Invalid person count',
        };
      }

      // Check if discount is active
      const discountActive = isDiscountActive(pkg);

      // Calculate price with discount applied
      let calculatedPrice = 0;
      let originalPrice = 0;
      const isSolo =
        item.isSoloTraveller && pkg.solo_traveller_enabled && pkg.solo_traveller_price;

      if (isSolo) {
        // Solo traveller pricing overrides per-person logic (no discount on solo)
        calculatedPrice = pkg.solo_traveller_price || 0;
        originalPrice = calculatedPrice;
      } else {
        // Regular pricing based on adult/child/infant counts
        // Calculate original price first
        if (pkg.adult_price && item.adults > 0) {
          originalPrice += pkg.adult_price * item.adults;
        }
        if (pkg.child_price && item.children > 0) {
          originalPrice += pkg.child_price * item.children;
        }
        if (pkg.infant_price && item.infants > 0) {
          originalPrice += pkg.infant_price * item.infants;
        }

        // Calculate discounted price
        if (discountActive) {
          const discountedAdultPrice = Math.max(0, (pkg.adult_price || 0) - (pkg.adult_discount_amount || 0));
          const discountedChildPrice = Math.max(0, (pkg.child_price || 0) - (pkg.child_discount_amount || 0));
          const discountedInfantPrice = Math.max(0, (pkg.infant_price || 0) - (pkg.infant_discount_amount || 0));

          if (item.adults > 0) {
            calculatedPrice += discountedAdultPrice * item.adults;
          }
          if (item.children > 0) {
            calculatedPrice += discountedChildPrice * item.children;
          }
          if (item.infants > 0) {
            calculatedPrice += discountedInfantPrice * item.infants;
          }
        } else {
          calculatedPrice = originalPrice;
        }

        // If no adult/child pricing, use base price
        if (originalPrice === 0) {
          calculatedPrice = pkg.package_price || 0;
          originalPrice = calculatedPrice;
        }
      }

      return {
        packageId: item.packageId,
        valid: true,
        packageName: pkg.package_name,
        price: calculatedPrice,
        originalPrice: discountActive && originalPrice !== calculatedPrice ? originalPrice : null,
        adultPrice: discountActive ? Math.max(0, (pkg.adult_price || 0) - (pkg.adult_discount_amount || 0)) : pkg.adult_price,
        childPrice: discountActive ? Math.max(0, (pkg.child_price || 0) - (pkg.child_discount_amount || 0)) : pkg.child_price,
        infantPrice: discountActive ? Math.max(0, (pkg.infant_price || 0) - (pkg.infant_discount_amount || 0)) : pkg.infant_price,
        basePrice: pkg.package_price,
        nights: pkg.package_nights,
        days: pkg.package_days,
        thumbnailImage: pkg.thumbnail_image,
        // Discount info
        isDiscountActive: discountActive,
        adultDiscountAmount: discountActive ? pkg.adult_discount_amount : null,
        childDiscountAmount: discountActive ? pkg.child_discount_amount : null,
        infantDiscountAmount: discountActive ? pkg.infant_discount_amount : null,
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
