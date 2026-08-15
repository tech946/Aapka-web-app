import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getAgentSession } from '@/lib/agent-session';
import { normalizeAcceptPayment } from '@/lib/package-payment';
import {
  MARINA_CRUISE_SLUG,
  calcMarinaAddonsPrice,
  getMarinaAddonLabels,
  getMarinaRegistrationPrices,
  isMarinaCruiseDateBookable,
  isMarinaRegistrationMode,
  parseMarinaAddons,
} from '@/lib/marina-cruise-config';

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
  // Referral data - SECURITY: only referralId is trusted, other fields verified from DB
  referralId?: string | null;
  referralDiscountApplied?: boolean; // Client-provided, will be verified against DB
  referralDiscountPercentage?: number; // Client-provided, will be verified against DB
  // Add-ons (offer packages)
  addonDeals?: string[];
  addonHotelServices?: string[];
  addonPrivateTransfers?: string[];
  categorySlug?: string;
  marinaAddons?: string[];
}

// Interface for verified referral data from database
interface VerifiedReferral {
  id: string;
  linkType: 'discount' | 'commission';
  discountPercentage: number;
  agentId: string;
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

function validateMarinaCartItem(
  item: CartItemRequest,
  marinaPkg: Record<string, unknown> | undefined
) {
  if (!marinaPkg) {
    return {
      packageId: item.packageId,
      valid: false as const,
      error: 'Package not found',
    };
  }

  if (marinaPkg.status !== 'active') {
    return {
      packageId: item.packageId,
      valid: false as const,
      error: 'Package not available',
    };
  }

  if (item.adults < 0 || item.children < 0 || item.infants < 0) {
    return {
      packageId: item.packageId,
      valid: false as const,
      error: 'Invalid person count',
    };
  }

  if (!item.selectedDate) {
    return {
      packageId: item.packageId,
      valid: false as const,
      error: 'Date is required',
    };
  }

  const dateStr = item.selectedDate.split('T')[0];
  const [y, m, d] = dateStr.split('-').map(Number);
  const checkDate = new Date(y, m - 1, d);
  checkDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (checkDate < today) {
    return {
      packageId: item.packageId,
      valid: false as const,
      error: 'Invalid date',
    };
  }

  if (
    !isMarinaCruiseDateBookable(
      checkDate,
      marinaPkg.booking_days as number[] | null | undefined,
      marinaPkg.bookable_dates as string[] | null | undefined
    )
  ) {
    return {
      packageId: item.packageId,
      valid: false as const,
      error: 'Date not available',
    };
  }

  const adults = item.isSoloTraveller ? 1 : item.adults;
  const children = item.isSoloTraveller ? 0 : item.children;

  let adultPrice = 0;
  let childPrice = 0;
  if (isMarinaRegistrationMode(marinaPkg)) {
    const reg = getMarinaRegistrationPrices(marinaPkg);
    adultPrice = reg.adultPrice;
    childPrice = reg.childPrice;
  } else {
    adultPrice = Number(marinaPkg.adult_price) || 0;
    childPrice = Number(marinaPkg.child_price) || 0;
  }

  let calculatedPrice = adultPrice * adults + childPrice * children;
  if (
    calculatedPrice === 0 &&
    marinaPkg.package_price &&
    Number(marinaPkg.package_price) > 0
  ) {
    calculatedPrice = Number(marinaPkg.package_price);
  }

  const marinaAddonsList = parseMarinaAddons(marinaPkg.addons);
  const selectedMarinaAddons = (item.marinaAddons || []).filter(id =>
    marinaAddonsList.some(a => a.id === id)
  );
  const addonPrice = calcMarinaAddonsPrice(
    marinaAddonsList,
    selectedMarinaAddons,
    adults,
    children
  );
  calculatedPrice += addonPrice;

  const marinaAddonLabels = getMarinaAddonLabels(
    marinaAddonsList,
    selectedMarinaAddons
  );

  return {
    packageId: item.packageId,
    selectedDate: item.selectedDate ?? null,
    valid: true as const,
    packageName: String(marinaPkg.package_name ?? ''),
    price: calculatedPrice,
    originalPrice: null,
    adultPrice,
    childPrice,
    infantPrice: 0,
    basePrice: marinaPkg.package_price != null ? Number(marinaPkg.package_price) : null,
    nights: null,
    days: null,
    thumbnailImage: (marinaPkg.thumbnail_image as string | null) ?? null,
    isDiscountActive: false,
    hasActiveDeal: false,
    adultDiscountAmount: null,
    childDiscountAmount: null,
    infantDiscountAmount: null,
    // Marina cruises are never agent-discounted: marina_cruise_dinners has no
    // agent_discount column (dropped in 20250616000001).
    agentDiscountAmount: null,
    priceBeforeAgentDiscount: null,
    referralDiscountAmount: null,
    priceBeforeReferralDiscount: null,
    verifiedReferralId: null,
    verifiedReferralLinkType: null,
    // Marina cruise is already full-payment-only by category rule
    acceptPayment: 'full' as const,
    visaPrice: 0,
    dateSurcharge: null,
    adultVisaPrice: null,
    childVisaPrice: null,
    infantVisaPrice: null,
    marinaAddonLabels,
  };
}

const CRM_BASE_URL = 'https://crm.aapkatourism.com';

// Helper to fetch addon data from CRM and calculate addon price for an item
async function calculateAddonPrice(
  addonDeals: string[] | undefined,
  addonHotelServices: string[] | undefined,
  addonPrivateTransfers: string[] | undefined,
  adults: number,
  children: number,
  infants: number,
  nights: number
): Promise<number> {
  const dealIds = addonDeals?.filter(Boolean) || [];
  const serviceIds = addonHotelServices?.filter(Boolean) || [];
  const transferIds = addonPrivateTransfers?.filter(Boolean) || [];
  if (dealIds.length === 0 && serviceIds.length === 0 && transferIds.length === 0) return 0;

  const apiKey = process.env.WEBSITE_API_KEY?.trim();
  if (!apiKey) return 0;

  let total = 0;
  const addPerPerson = (a: number, c: number, i: number) =>
    (a || 0) * adults + (c || 0) * children + (i || 0) * infants;

  try {
    if (dealIds.length > 0) {
      const params = nights > 0 ? `?nights=${nights}` : '';
      const res = await fetch(`${CRM_BASE_URL}/api/website/addon-deals${params}`, {
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        const deals = Array.isArray(data?.addon_deals) ? data.addon_deals : [];
        for (const id of dealIds) {
          const d = deals.find((x: any) => x?.id === id);
          if (d) total += addPerPerson(d.adult_price, d.child_price, d.infant_price);
        }
      }
    }
    if (serviceIds.length > 0) {
      const res = await fetch(`${CRM_BASE_URL}/api/website/addon-hotel-services`, {
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        const services = Array.isArray(data?.addon_hotel_services) ? data.addon_hotel_services : [];
        for (const id of serviceIds) {
          const s = services.find((x: any) => x?.id === id);
          if (s) total += addPerPerson(s.adult_price, s.child_price, s.infant_price);
        }
      }
    }
    if (transferIds.length > 0) {
      const res = await fetch(`${CRM_BASE_URL}/api/website/addon-private-transfers`, {
        headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        const transfers = Array.isArray(data?.addon_private_transfers) ? data.addon_private_transfers : [];
        for (const id of transferIds) {
          const t = transfers.find((x: any) => x?.id === id);
          if (t) total += addPerPerson(t.adult_price, t.child_price, t.infant_price);
        }
      }
    }
  } catch (e) {
    console.error('Error fetching addon prices:', e);
  }
  return total;
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

    // Check if user has active agent subscription (shared with checkout/booking)
    const { hasActiveSubscription: hasActiveAgentSubscription } =
      await getAgentSession();

    // Fetch all packages at once (including date_ranges for flexible date pricing)
    const regularItems = items.filter(
      i => i.categorySlug !== MARINA_CRUISE_SLUG
    );
    const marinaItems = items.filter(
      i => i.categorySlug === MARINA_CRUISE_SLUG
    );

    const packageIds = regularItems.map(item => item.packageId);
    const marinaPackageIds = marinaItems.map(item => item.packageId);

    let packages: any[] | null = [];
    let fetchError: { message: string } | null = null;

    if (packageIds.length > 0) {
      const result = await supabaseAdmin
        .from('packages')
        .select(
          'package_id, package_name, package_price, adult_price, child_price, infant_price, solo_traveller_enabled, solo_traveller_price, with_visa, adult_visa_price, child_visa_price, infant_visa_price, package_nights, package_days, thumbnail_image, date_ranges, adult_discount_amount, child_discount_amount, infant_discount_amount, discount_start_date, discount_end_date, agent_discount, accept_payment'
        )
        .in('package_id', packageIds);
      packages = result.data;
      fetchError = result.error;
    }

    const marinaPackagesMap = new Map<string, Record<string, unknown>>();
    if (marinaPackageIds.length > 0) {
      const { data: marinaPackages, error: marinaFetchError } =
        await supabaseAdmin
          .from('marina_cruise_dinners')
          .select(
            'package_id, package_name, package_price, adult_price, child_price, registration_only, registration_adult_price, registration_child_price, bookable_dates, booking_days, addons, thumbnail_image, status'
          )
          .in('package_id', marinaPackageIds);

      if (marinaFetchError) {
        return NextResponse.json(
          { error: marinaFetchError.message },
          { status: 400 }
        );
      }

      for (const row of marinaPackages || []) {
        marinaPackagesMap.set(String(row.package_id), row);
      }
    }

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }

    /* Date surcharges are no longer applied to cart pricing. The
       surcharge_master table and its admin screen are untouched - only the
       customer-facing charge was removed. */

    // Fetch active deals for all packages
    const fetchedPackageIds = packages?.map(p => p.package_id) || [];
    let activeDealsMap = new Map();
    
    if (fetchedPackageIds.length > 0) {
      const now = new Date().toISOString();
      const { data: dealsData } = await supabaseAdmin
        .from('package_deals')
        .select('*')
        .in('package_id', fetchedPackageIds)
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now);

      if (dealsData) {
        dealsData.forEach((deal: any) => {
          activeDealsMap.set(deal.package_id, deal);
        });
      }
    }

    // SECURITY: Verify referral IDs from database instead of trusting client data
    // Collect unique referral IDs and verify them
    const referralIds = [...new Set(items.filter(i => i.referralId).map(i => i.referralId as string))];
    const verifiedReferralsMap = new Map<string, VerifiedReferral>();
    
    if (referralIds.length > 0) {
      const { data: referrals } = await supabaseAdmin
        .from('agent_referrals')
        .select('id, agent_id, link_type, discount_percentage, status, expires_at')
        .in('id', referralIds)
        .eq('status', 'active');
      
      if (referrals) {
        const now = new Date();
        referrals.forEach((ref: any) => {
          // Only include valid, non-expired referrals
          if (ref.expires_at && new Date(ref.expires_at) > now) {
            verifiedReferralsMap.set(ref.id, {
              id: ref.id,
              linkType: ref.link_type || 'commission',
              discountPercentage: ref.discount_percentage || 0,
              agentId: ref.agent_id,
            });
          }
        });
      }
    }

    // Helper function to apply deal prices
    const applyDealPrices = (
      packageId: string,
      adult: number,
      child: number,
      infant: number,
      solo: number | null
    ): { adultPrice: number; childPrice: number; infantPrice: number; soloTravellerPrice: number | null } => {
      const deal = activeDealsMap.get(packageId);
      if (!deal) {
        return { adultPrice: adult, childPrice: child, infantPrice: infant, soloTravellerPrice: solo };
      }

      const now = new Date();
      const startDate = new Date(deal.start_date);
      const endDate = new Date(deal.end_date);

      // Check if deal is currently active
      if (deal.is_active && now >= startDate && now <= endDate) {
        return {
          adultPrice: deal.deal_adult_price !== null ? deal.deal_adult_price : adult,
          childPrice: deal.deal_child_price !== null ? deal.deal_child_price : child,
          infantPrice: deal.deal_infant_price !== null ? deal.deal_infant_price : infant,
          soloTravellerPrice: deal.deal_solo_traveller_price !== null ? deal.deal_solo_traveller_price : solo,
        };
      }

      return { adultPrice: adult, childPrice: child, infantPrice: infant, soloTravellerPrice: solo };
    };

    // Validate and calculate prices for each cart item
    const validatedItems = await Promise.all(items.map(async item => {
      if (item.categorySlug === MARINA_CRUISE_SLUG) {
        return validateMarinaCartItem(
          item,
          marinaPackagesMap.get(item.packageId)
        );
      }

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

      // Get date-specific pricing from date_ranges if a date is selected (for flexible date packages)
      // For tours/offer packages, even if selectedDate exists (from travel_dates), use columns
      let adultPrice = 0;
      let childPrice = 0;
      let infantPrice = 0;
      let soloTravellerPrice: number | null = null;
      let usePackagePriceAsFlatRate = false; // Flag to use package_price directly
      let isFlexibleDatePackage = false; // Flag to identify flexible date packages
      
      if (item.selectedDate) {
        // Check if this is a flexible date package by looking for the date in date_ranges
        const dateStr = item.selectedDate.split('T')[0];
        const dateRange = findDateRangeForDate(pkg.date_ranges, dateStr);
        
        if (dateRange) {
          // This is a flexible date package - use pricing from the date range
          isFlexibleDatePackage = true;
          adultPrice = dateRange.adultPrice || 0;
          childPrice = dateRange.childPrice || 0;
          infantPrice = dateRange.infantPrice || 0;
          soloTravellerPrice = dateRange.soloTravellerPrice ?? null;
        } else {
          // No date range found - this is a tour/offer package with selectedDate from travel_dates
          // Use package base prices from columns (for tours and offer packages)
          isFlexibleDatePackage = false;
          const hasPerPersonPricing = pkg.adult_price != null || pkg.child_price != null || pkg.infant_price != null;
          
          if (hasPerPersonPricing) {
            // Use per-person pricing from columns
            adultPrice = pkg.adult_price ?? 0;
            childPrice = pkg.child_price ?? 0;
            infantPrice = pkg.infant_price ?? 0;
          } else {
            // No per-person pricing set, will use package_price as flat rate
            usePackagePriceAsFlatRate = true;
          }
          soloTravellerPrice = pkg.solo_traveller_price ?? null;
        }
      } else {
        // No date selected
        // For flexible date packages, use minimum price from date ranges (for display)
        if (pkg.date_ranges && Array.isArray(pkg.date_ranges) && pkg.date_ranges.length > 0) {
          const availableRanges = pkg.date_ranges.filter((r: any) => !r.isSoldOut);
          if (availableRanges.length > 0) {
            isFlexibleDatePackage = true;
            // Get the range with minimum adult price for display when no date selected
            const minRange = availableRanges.reduce((min: any, range: any) => 
              (range.adultPrice < min.adultPrice) ? range : min
            , availableRanges[0]);
            
            adultPrice = minRange.adultPrice || 0;
            childPrice = minRange.childPrice || 0;
            infantPrice = minRange.infantPrice || 0;
            soloTravellerPrice = minRange.soloTravellerPrice ?? null;
          } else {
            // All ranges sold out, use package base prices
            const hasPerPersonPricing = pkg.adult_price != null || pkg.child_price != null || pkg.infant_price != null;
            if (hasPerPersonPricing) {
              adultPrice = pkg.adult_price ?? 0;
              childPrice = pkg.child_price ?? 0;
              infantPrice = pkg.infant_price ?? 0;
            } else {
              usePackagePriceAsFlatRate = true;
            }
            soloTravellerPrice = pkg.solo_traveller_price ?? null;
          }
        } else {
          // Not a flexible date package - use package base prices (for tours and offer packages)
          const hasPerPersonPricing = pkg.adult_price != null || pkg.child_price != null || pkg.infant_price != null;
          
          if (hasPerPersonPricing) {
            // Use per-person pricing from columns
            adultPrice = pkg.adult_price ?? 0;
            childPrice = pkg.child_price ?? 0;
            infantPrice = pkg.infant_price ?? 0;
          } else {
            // No per-person pricing set, will use package_price as flat rate
            usePackagePriceAsFlatRate = true;
          }
          soloTravellerPrice = pkg.solo_traveller_price ?? null;
        }
      }

      // Store original prices before applying deal
      const originalAdultPrice = adultPrice;
      const originalChildPrice = childPrice;
      const originalInfantPrice = infantPrice;
      const originalSoloPrice = soloTravellerPrice;

      // Apply deal prices if active deal exists
      const dealPrices = applyDealPrices(
        pkg.package_id,
        adultPrice,
        childPrice,
        infantPrice,
        soloTravellerPrice
      );
      
      // Check if deal is actually applied (prices changed)
      const hasActiveDeal = 
        dealPrices.adultPrice !== originalAdultPrice ||
        dealPrices.childPrice !== originalChildPrice ||
        dealPrices.infantPrice !== originalInfantPrice ||
        dealPrices.soloTravellerPrice !== originalSoloPrice;
      
      adultPrice = dealPrices.adultPrice;
      childPrice = dealPrices.childPrice;
      infantPrice = dealPrices.infantPrice;
      soloTravellerPrice = dealPrices.soloTravellerPrice;

      // Calculate price with discount applied
      let calculatedPrice = 0;
      let originalPrice = 0;
      const isSolo =
        item.isSoloTraveller && pkg.solo_traveller_enabled;

      if (isSolo) {
        // Solo traveller pricing overrides per-person logic (no discount on solo)
        // Use solo traveller price from date range if available, otherwise from package
        // For tours/offer packages, if solo_traveller_price is not set, fall back to package_price
        calculatedPrice = soloTravellerPrice ?? pkg.solo_traveller_price ?? (isFlexibleDatePackage ? 0 : (pkg.package_price ?? 0));
        originalPrice = calculatedPrice;
      } else {
        if (usePackagePriceAsFlatRate) {
          // No per-person pricing set, use package_price as flat rate (for tours and offer packages)
          calculatedPrice = pkg.package_price ?? 0;
          originalPrice = calculatedPrice;
        } else {
          // Regular pricing based on adult/child/infant counts from columns
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
          if (discountActive && !isFlexibleDatePackage) {
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

          // Fallback: If calculated price is still 0 and we have package_price, use it
          // This handles cases where:
          // 1. adult_price/child_price/infant_price are explicitly set to 0
          // 2. No adults/children/infants selected
          // 3. All prices are 0 but package_price exists
          // Only apply fallback for non-flexible date packages
          if (calculatedPrice === 0 && originalPrice === 0 && !isFlexibleDatePackage) {
            if (pkg.package_price && pkg.package_price > 0) {
              calculatedPrice = pkg.package_price;
              originalPrice = pkg.package_price;
            }
          }
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

      // Add addon pricing (offer packages - deals, hotel services, private transfers)
      const addonPrice = await calculateAddonPrice(
        item.addonDeals,
        item.addonHotelServices,
        item.addonPrivateTransfers,
        item.isSoloTraveller ? 1 : item.adults,
        item.isSoloTraveller ? 0 : item.children,
        item.isSoloTraveller ? 0 : item.infants,
        pkg.package_nights ?? 0
      );
      calculatedPrice += addonPrice;
      originalPrice += addonPrice;

      // Date surcharge removed - no longer added to the price

      // SECURITY: Apply discount based on verified data, not client-provided values
      // Priority 1: Agent with active subscription gets agent discount
      // Priority 2: Customer via discount-type referral link gets referral discount (verified from DB)
      let agentDiscountAmount = 0;
      let referralDiscountAmount = 0;
      let isReferralDiscount = false;
      
      // Get verified referral data from database (not from client)
      const verifiedReferral = item.referralId ? verifiedReferralsMap.get(item.referralId) : null;
      
      // Check if agent discount should apply (logged-in agent with subscription)
      const shouldApplyAgentDiscount = hasActiveAgentSubscription && pkg?.agent_discount && pkg.agent_discount > 0;
      
      // Check if referral discount should apply (verified from DB as discount-type link)
      // IMPORTANT: Agent discount and referral discount are mutually exclusive
      // An agent cannot use their own or another agent's referral link
      const shouldApplyReferralDiscount = !hasActiveAgentSubscription && 
        verifiedReferral && 
        verifiedReferral.linkType === 'discount' && 
        verifiedReferral.discountPercentage > 0;
      
      if (shouldApplyAgentDiscount) {
        // Agent discount (for logged-in agents)
        const discountPercentage = pkg.agent_discount;
        agentDiscountAmount = (calculatedPrice * discountPercentage) / 100;
        calculatedPrice = Math.max(0, calculatedPrice - agentDiscountAmount);
      } else if (shouldApplyReferralDiscount) {
        // Referral discount (verified from DB, not from client)
        isReferralDiscount = true;
        const discountPercentage = verifiedReferral.discountPercentage;
        referralDiscountAmount = (calculatedPrice * discountPercentage) / 100;
        calculatedPrice = Math.max(0, calculatedPrice - referralDiscountAmount);
      }

      // Calculate price before discount for display
      const totalDiscountAmount = agentDiscountAmount + referralDiscountAmount;
      const priceBeforeAgentDiscount = totalDiscountAmount > 0 
        ? calculatedPrice + totalDiscountAmount 
        : null;

      // Calculate original price based on original prices (before deal) for display
      let originalPriceForDisplay = originalPrice;
      if (hasActiveDeal) {
        // Recalculate original price using original prices (before deal)
        if (isSolo) {
          originalPriceForDisplay = originalSoloPrice ?? pkg.solo_traveller_price ?? (isFlexibleDatePackage ? 0 : (pkg.package_price ?? 0));
        } else {
          if (usePackagePriceAsFlatRate) {
            originalPriceForDisplay = pkg.package_price ?? 0;
          } else {
            originalPriceForDisplay = 0;
            if (originalAdultPrice > 0 && item.adults > 0) {
              originalPriceForDisplay += originalAdultPrice * item.adults;
            }
            if (originalChildPrice > 0 && item.children > 0) {
              originalPriceForDisplay += originalChildPrice * item.children;
            }
            if (originalInfantPrice > 0 && item.infants > 0) {
              originalPriceForDisplay += originalInfantPrice * item.infants;
            }
            if (originalPriceForDisplay === 0 && !isFlexibleDatePackage && pkg.package_price && pkg.package_price > 0) {
              originalPriceForDisplay = pkg.package_price;
            }
          }
        }
        originalPriceForDisplay += visaPrice;
        originalPriceForDisplay += addonPrice;
      }

      return {
        packageId: item.packageId,
        selectedDate: item.selectedDate ?? null,
        valid: true,
        packageName: pkg.package_name,
        price: calculatedPrice,
        originalPrice: (hasActiveDeal && originalPriceForDisplay > calculatedPrice) || (discountActive && originalPrice !== calculatedPrice) 
          ? (hasActiveDeal ? originalPriceForDisplay : originalPrice) 
          : null,
        adultPrice: discountActive && !isFlexibleDatePackage ? Math.max(0, adultPrice - (pkg.adult_discount_amount || 0)) : adultPrice,
        childPrice: discountActive && !isFlexibleDatePackage ? Math.max(0, childPrice - (pkg.child_discount_amount || 0)) : childPrice,
        infantPrice: discountActive && !isFlexibleDatePackage ? Math.max(0, infantPrice - (pkg.infant_discount_amount || 0)) : infantPrice,
        basePrice: pkg.package_price,
        nights: pkg.package_nights,
        days: pkg.package_days,
        thumbnailImage: pkg.thumbnail_image,
        // Discount info
        isDiscountActive: discountActive || hasActiveDeal,
        hasActiveDeal: hasActiveDeal,
        adultDiscountAmount: discountActive ? pkg.adult_discount_amount : null,
        childDiscountAmount: discountActive ? pkg.child_discount_amount : null,
        infantDiscountAmount: discountActive ? pkg.infant_discount_amount : null,
        // Agent discount info (for logged-in agents with subscription)
        agentDiscountAmount: shouldApplyAgentDiscount && agentDiscountAmount > 0 ? agentDiscountAmount : null,
        priceBeforeAgentDiscount: priceBeforeAgentDiscount,
        // Referral discount info (for customers via discount-type referral link - verified from DB)
        referralDiscountAmount: isReferralDiscount && referralDiscountAmount > 0 ? referralDiscountAmount : null,
        priceBeforeReferralDiscount: isReferralDiscount && referralDiscountAmount > 0 ? calculatedPrice + referralDiscountAmount : null,
        // Verified referral tracking info (for booking creation)
        verifiedReferralId: verifiedReferral?.id || null,
        verifiedReferralLinkType: verifiedReferral?.linkType || null,
        // Checkout payment rule for this package ('full' = no half option)
        acceptPayment: normalizeAcceptPayment(pkg.accept_payment),
        // Visa info
        visaPrice: visaPrice,
        // Date surcharge removed from customer pricing
        dateSurcharge: null,
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
