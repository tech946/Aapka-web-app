import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface DateRange {
  id: string;
  fromDate: string;
  toDate: string;
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  soloTravellerPrice?: number | null;
  isSoldOut: boolean;
}

interface CartItemRequest {
  packageId: string;
  adults: number;
  children: number;
  infants: number;
  selectedDate: string | null;
  isSoloTraveller?: boolean;
  withVisa?: boolean;
  visaForAdults?: number;
  visaForChildren?: number;
  visaForInfants?: number;
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

// Helper function to find the date range that contains a given date
function findDateRangeForDate(dateRanges: DateRange[] | null | undefined, dateStr: string): DateRange | null {
  if (!dateRanges || !Array.isArray(dateRanges)) return null;
  const targetDate = new Date(dateStr);
  for (const range of dateRanges) {
    const fromDate = new Date(range.fromDate);
    const toDate = new Date(range.toDate);
    if (targetDate >= fromDate && targetDate <= toDate) {
      return range;
    }
  }
  return null;
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

    // Fetch all packages at once (including date_ranges for flexible date pricing)
    const packageIds = items.map(item => item.packageId);
    const { data: packages, error: fetchError } = await supabaseAdmin
      .from('packages')
      .select(
        'package_id, package_name, package_price, adult_price, child_price, infant_price, solo_traveller_enabled, solo_traveller_price, with_visa, adult_visa_price, child_visa_price, infant_visa_price, package_nights, package_days, thumbnail_image, date_ranges, adult_discount_amount, child_discount_amount, infant_discount_amount, discount_start_date, discount_end_date'
      )
      .in('package_id', packageIds);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }

    // Validate and calculate prices for each cart item
    const validatedItems = await Promise.all(items.map(async item => {
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

      // Check if discount is active (only for non-flexible date packages)
      const discountActive = isDiscountActive(pkg);

      // Get date-specific pricing from date_ranges if a date is selected
      let adultPrice = 0;
      let childPrice = 0;
      let infantPrice = 0;
      let soloTravellerPrice: number | null = null;
      
      if (item.selectedDate) {
        // For flexible date packages, get pricing from the date range that contains the selected date
        const dateStr = item.selectedDate.split('T')[0];
        const dateRange = findDateRangeForDate(pkg.date_ranges, dateStr);
        if (dateRange) {
          // Use pricing from the date range
          adultPrice = dateRange.adultPrice || 0;
          childPrice = dateRange.childPrice || 0;
          infantPrice = dateRange.infantPrice || 0;
          soloTravellerPrice = dateRange.soloTravellerPrice ?? null;
        }
        // If no date range found, prices remain 0 (flexible date packages require valid date range)
      } else {
        // If no date selected, use package base prices (for non-flexible date packages)
        adultPrice = pkg.adult_price || 0;
        childPrice = pkg.child_price || 0;
        infantPrice = pkg.infant_price || 0;
        soloTravellerPrice = pkg.solo_traveller_price ?? null;
      }

      // Calculate price with discount applied
      let calculatedPrice = 0;
      let originalPrice = 0;
      const isSolo =
        item.isSoloTraveller && pkg.solo_traveller_enabled;

      if (isSolo) {
        // Solo traveller pricing overrides per-person logic (no discount on solo)
        // Use solo traveller price from date range if available, otherwise from package
        calculatedPrice = soloTravellerPrice ?? pkg.solo_traveller_price ?? 0;
        originalPrice = calculatedPrice;
      } else {
        // Regular pricing based on adult/child/infant counts
        // Calculate original price first
        if (adultPrice > 0 && item.adults > 0) {
          originalPrice += adultPrice * item.adults;
        }
        if (childPrice > 0 && item.children > 0) {
          originalPrice += childPrice * item.children;
        }
        if (infantPrice > 0 && item.infants > 0) {
          originalPrice += infantPrice * item.infants;
        }

        // Calculate discounted price (only for non-flexible date packages)
        if (discountActive && !item.selectedDate) {
          const discountedAdultPrice = Math.max(0, adultPrice - (pkg.adult_discount_amount || 0));
          const discountedChildPrice = Math.max(0, childPrice - (pkg.child_discount_amount || 0));
          const discountedInfantPrice = Math.max(0, infantPrice - (pkg.infant_discount_amount || 0));

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

        // If no adult/child pricing, use base price (only for non-flexible date packages)
        // For flexible date packages with selectedDate, don't fall back to package base price
        if (originalPrice === 0 && !item.selectedDate) {
          calculatedPrice = pkg.package_price || 0;
          originalPrice = calculatedPrice;
        }
      }

      // Add visa pricing if enabled
      let visaPrice = 0;
      if (item.withVisa && pkg.with_visa) {
        if (pkg.adult_visa_price && item.visaForAdults && item.visaForAdults > 0) {
          visaPrice += pkg.adult_visa_price * item.visaForAdults;
        }
        if (pkg.child_visa_price && item.visaForChildren && item.visaForChildren > 0) {
          visaPrice += pkg.child_visa_price * item.visaForChildren;
        }
        if (pkg.infant_visa_price && item.visaForInfants && item.visaForInfants > 0) {
          visaPrice += pkg.infant_visa_price * item.visaForInfants;
        }
      }
      calculatedPrice += visaPrice;
      originalPrice += visaPrice;

      return {
        packageId: item.packageId,
        valid: true,
        packageName: pkg.package_name,
        price: calculatedPrice,
        originalPrice: discountActive && originalPrice !== calculatedPrice ? originalPrice : null,
        adultPrice: discountActive && !item.selectedDate ? Math.max(0, adultPrice - (pkg.adult_discount_amount || 0)) : adultPrice,
        childPrice: discountActive && !item.selectedDate ? Math.max(0, childPrice - (pkg.child_discount_amount || 0)) : childPrice,
        infantPrice: discountActive && !item.selectedDate ? Math.max(0, infantPrice - (pkg.infant_discount_amount || 0)) : infantPrice,
        basePrice: pkg.package_price,
        nights: pkg.package_nights,
        days: pkg.package_days,
        thumbnailImage: pkg.thumbnail_image,
        // Discount info
        isDiscountActive: discountActive,
        adultDiscountAmount: discountActive ? pkg.adult_discount_amount : null,
        childDiscountAmount: discountActive ? pkg.child_discount_amount : null,
        infantDiscountAmount: discountActive ? pkg.infant_discount_amount : null,
        // Visa info
        visaPrice: visaPrice,
        adultVisaPrice: pkg.adult_visa_price,
        childVisaPrice: pkg.child_visa_price,
        infantVisaPrice: pkg.infant_visa_price,
      };
    }));

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
