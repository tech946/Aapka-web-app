'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useBooking, type BookingRequest } from '@/context/BookingContext';
import { toast } from 'sonner';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import {
  usesBookingSlots,
  getTourFixedBookingDates,
  getTourDefaultFixedBookingDate,
  getTourDefaultWeekendRangeDate,
  getTourWeekendRangeEarliestBookable,
  getTourWeekendRangeInitialMonth,
  getTourWeekendRangeRule,
  isDateOnTourWeekendRange,
  isTourWeekendRangeExtraDate,
} from '@/lib/package-config';
import { isDateOnTourBookingDay } from '@/lib/tour-booking-days';
import {
  getPackageGalleryImages,
  normalizePackageGallery,
} from '@/lib/package-gallery';
import {
  detectUserLocation,
  initializeExchangeRate,
  type UserLocation,
} from '@/lib/location-utils';
import { parseDateStringToLocal } from '@/lib/utils';
import {
  getOfferPackageTravelDates,
  MIN_BOOKING_LEAD_DAYS,
} from '@/lib/offer-package-dates';
import {
  getAnyDateBlockReason,
  getAnyDateEarliestBookable,
} from '@/lib/anydate-availability';
import type { SurchargeMasterEntry } from '@/lib/surcharge-master';
import { isPackagePriceRevealingSoon } from '@/lib/package-pricing';
import {
  shouldShowOptionalVisaInBookingModal,
  hasVisaIncludedAtZeroPrice,
} from '@/lib/package-visa';
import { packageRequiresFullPayment } from '@/lib/package-payment';
import { useAddonDeals, useAddonHotelServices, useAddonPrivateTransfers } from '@/hooks/use-marketing-queries';
import { holidaysHref, typeForCategory } from '@/config/holiday-types';
import { inclusionsOf } from '@/components/site/listing/listing-data';
import PdpShell from '@/components/site/pdp/PdpShell';
import PdpState from '@/components/site/pdp/PdpState';
import PackageBookingCard from '@/components/site/pdp/PackageBookingCard';
import { buildQuote } from '@/components/site/pdp/booking';
import { durationLabel, money, singular } from '@/components/site/pdp/pdp-data';

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

interface Package {
  package_id: string;
  package_name: string;
  package_description: string | null;
  package_price: number | null;
  package_days?: number | null;
  package_nights?: number | null;
  package_category_id?: string;
  adult_price?: number | null;
  child_price?: number | null;
  infant_price?: number | null;
  solo_traveller_enabled?: boolean | null;
  solo_traveller_price?: number | null;
  solo_traveller_only?: boolean | null;
  solo_room_type?: string | null;
  with_visa?: boolean | null;
  adult_visa_price?: number | null;
  child_visa_price?: number | null;
  infant_visa_price?: number | null;
  // Minimum adults required
  min_adults?: number | null;
  // Discount fields
  adult_discount_amount?: number | null;
  child_discount_amount?: number | null;
  infant_discount_amount?: number | null;
  discount_start_date?: string | null;
  discount_end_date?: string | null;
  agent_discount?: number | null;
  /** 'full' = no 50% option at checkout */
  accept_payment?: string | null;
  // Deal of the day
  active_deal?: {
    deal_adult_price: number | null;
    deal_child_price: number | null;
    deal_infant_price: number | null;
    deal_solo_traveller_price: number | null;
    start_date: string;
    end_date: string;
    is_active: boolean;
  } | null;
  overview?: string | null;
  terms_html?: string | null;
  inclusion_html?: string | null;
  exclusion_html?: string | null;
  holiday_description_html?: string | null;
  itinerary?: Array<{ heading: string; desc: string }> | null;
  travel_dates?: Array<{ id: string; value: string }> | string[] | null;
  booking_slots?: Array<{
    id: string;
    fromDate: string;
    toDate: string;
  }> | null;
  booking_days?: number[] | null;
  /* Any-date packages: only the entries flagged `isSoldOut` are still used —
     pricing comes from the package's own adult/child/infant prices. */
  date_ranges?: DateRange[] | null;
  surcharge_block_days_before?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  thumbnail_image?: string | null;
  gallery?: string[] | null;
  pdf_url?: string | null;
  created_at?: string | null;
}

export default function PackageDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startBooking } = useBooking();
  const slug = params?.slug as string;
  const packageSlug = params?.packageId as string;

  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRangesReady, setDateRangesReady] = useState(false);
  const [surcharges, setSurcharges] = useState<SurchargeMasterEntry[]>([]);
  const [category, setCategory] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedDateString, setSelectedDateString] = useState<string>('');
  const [month, setMonth] = useState<Date>(new Date());
  const [persons, setPersons] = useState({
    adult: 1, // Start with 1 adult minimum
    child: 0,
    infant: 0,
  });
  const [isSoloTraveller, setIsSoloTraveller] = useState(false);
  const [soloTravellerGender, setSoloTravellerGender] = useState<
    'male' | 'female' | null
  >(null);
  const [soloTravellerShareConsent, setSoloTravellerShareConsent] =
    useState(false);
  const [withVisa, setWithVisa] = useState(false);
  const [visaForAdults, setVisaForAdults] = useState(0);
  const [visaForChildren, setVisaForChildren] = useState(0);
  const [visaForInfants, setVisaForInfants] = useState(0);
  const [isAgent, setIsAgent] = useState(false);
  const [hasActiveAgentSubscription, setHasActiveAgentSubscription] =
    useState(false);
  // Referral tracking state (for customers arriving via agent's referral link)
  const [referralData, setReferralData] = useState<{
    id: string;
    agentId: string;
    agentName: string;
    linkType: 'discount' | 'commission';
    discountPercentage: number;
    showDiscount: boolean;
  } | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralDiscountAmount, setReferralDiscountAmount] = useState<
    number | null
  >(null);
  const [priceBeforeReferralDiscount, setPriceBeforeReferralDiscount] =
    useState<number | null>(null);
  /* Date surcharges were removed from offer-package pricing. */
  /* Add-ons (offer packages) */
  const [addonDeals, setAddonDeals] = useState<string[]>([]);
  const [addonHotelServices, setAddonHotelServices] = useState<string[]>([]);
  const [addonPrivateTransfers, setAddonPrivateTransfers] = useState<string[]>(
    []
  );
  // Addon data with prices - cached via TanStack Query when modal opens
  type AddonDeal = { id: string; name?: string; adult_price?: number; child_price?: number; infant_price?: number; category_name?: string | null };
  type AddonService = { id: string; name?: string; adult_price?: number; child_price?: number; infant_price?: number };
  type AddonTransfer = { id: string; name?: string; adult_price?: number; child_price?: number; infant_price?: number; pax_type?: string; fixed_pax?: number | null; min_pax?: number | null; max_pax?: number | null };
  /* Add-ons are switched off on this page (the old booking modal was passed
     showAddons={false}), so their price lists are never fetched and the
     selections below stay empty. */
  const shouldFetchAddons = false;
  const nights = pkg?.package_nights ?? 0;
  const { data: dealsRaw = [] } = useAddonDeals(nights, !!shouldFetchAddons);
  const { data: servicesRaw = [] } = useAddonHotelServices(!!shouldFetchAddons);
  const { data: transfersRaw = [] } = useAddonPrivateTransfers(!!shouldFetchAddons);
  const addonDealsData = useMemo(
    () => (Array.isArray(dealsRaw) ? dealsRaw.map((d: any) => ({ ...d, id: String(d?.id ?? ''), adult_price: d?.adult_price ?? 0, child_price: d?.child_price ?? 0, infant_price: d?.infant_price ?? 0 })) : []),
    [dealsRaw]
  );
  const addonServicesData = useMemo(
    () => (Array.isArray(servicesRaw) ? servicesRaw.map((s: any) => ({ ...s, id: String(s?.id ?? ''), adult_price: s?.adult_price ?? 0, child_price: s?.child_price ?? 0, infant_price: s?.infant_price ?? 0 })) : []),
    [servicesRaw]
  );
  const addonTransfersData = useMemo(
    () => (Array.isArray(transfersRaw) ? transfersRaw.map((t: any) => ({ ...t, id: String(t?.id ?? ''), adult_price: t?.adult_price ?? 0, child_price: t?.child_price ?? 0, infant_price: t?.infant_price ?? 0 })) : []),
    [transfersRaw]
  );

  /* Solo-only packages are sold to a single traveller: there is no traveller
     choice to make, so the booking is locked to one solo adult and min_adults
     never applies. */
  const soloOnly = Boolean(
    pkg?.solo_traveller_only && pkg?.solo_traveller_enabled
  );

  /* Room the solo traveller is sold, set per package from the dashboard. A
     shared room asks for - and requires - the sharing confirmation; a private
     room never asks for it. */
  const soloRoomType: 'private' | 'shared' =
    pkg?.solo_room_type === 'private' ? 'private' : 'shared';

  useEffect(() => {
    if (!soloOnly) return;
    setIsSoloTraveller(true);
    setPersons({ adult: 1, child: 0, infant: 0 });
  }, [soloOnly]);

  // Initialize minimum adults based on package's min_adults setting
  // Skip this if solo traveller is selected (solo traveller should have 1 adult)
  useEffect(() => {
    if (isSoloTraveller || soloOnly) return; // Don't override solo traveller's 1 adult
    if (!pkg) return; // Wait for package to load

    const minAdults = pkg.min_adults || 1;
    if (persons.adult < minAdults) {
      setPersons(prev => ({ ...prev, adult: minAdults }));
    }
  }, [pkg?.min_adults, persons.adult, isSoloTraveller, soloOnly]);

  // Sync visaForAdults to 1 when solo traveller is selected
  useEffect(() => {
    if (isSoloTraveller && withVisa && visaForAdults !== 1) {
      setVisaForAdults(1);
      setVisaForChildren(0);
      setVisaForInfants(0);
    }
  }, [isSoloTraveller, withVisa, visaForAdults]);

  // Clear optional visa selection when backend does not offer a paid add-on (with_visa and visa price greater than 0)
  useEffect(() => {
    if (!pkg) return;
    if (!shouldShowOptionalVisaInBookingModal(slug, pkg)) {
      setWithVisa(false);
      setVisaForAdults(0);
      setVisaForChildren(0);
      setVisaForInfants(0);
    }
  }, [
    slug,
    pkg?.package_id,
    pkg?.with_visa,
    pkg?.adult_visa_price,
    pkg?.child_visa_price,
    pkg?.infant_visa_price,
  ]);

  // Client-side addon price calculation from cached addon data - instant, no fetch on selection change
  const addonPriceTotal = useMemo(() => {
    if (slug !== 'offer-packages') return 0;
    const adults = isSoloTraveller ? 1 : persons.adult;
    const children = isSoloTraveller ? 0 : persons.child;
    const infants = isSoloTraveller ? 0 : persons.infant;
    const calc = (a: number, c: number, i: number) => (a || 0) * adults + (c || 0) * children + (i || 0) * infants;
    let total = 0;
    for (const id of addonDeals) {
      const d = addonDealsData.find(x => String(x.id) === String(id));
      if (d) total += calc(d.adult_price ?? 0, d.child_price ?? 0, d.infant_price ?? 0);
    }
    for (const id of addonHotelServices) {
      const s = addonServicesData.find(x => String(x.id) === String(id));
      if (s) total += calc(s.adult_price ?? 0, s.child_price ?? 0, s.infant_price ?? 0);
    }
    for (const id of addonPrivateTransfers) {
      const t = addonTransfersData.find(x => String(x.id) === String(id));
      if (t) total += calc(t.adult_price ?? 0, t.child_price ?? 0, t.infant_price ?? 0);
    }
    return total;
  }, [slug, addonDeals, addonHotelServices, addonPrivateTransfers, addonDealsData, addonServicesData, addonTransfersData, persons.adult, persons.child, persons.infant, isSoloTraveller]);

  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [agentDiscountAmount, setAgentDiscountAmount] = useState<number | null>(
    null
  );
  const [priceBeforeAgentDiscount, setPriceBeforeAgentDiscount] = useState<
    number | null
  >(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  // Note: Date ranges are now stored in pkg.date_ranges directly (no separate state needed)

  // Discount state
  const [isDiscountActive, setIsDiscountActive] = useState(false);
  const [discountTimeLeft, setDiscountTimeLeft] = useState<string>('');

  useEffect(() => {
    if (packageSlug) {
      // Reset package state when slug changes to prevent stale data
      setPkg(null);
      setLoading(true);
      setDateRangesReady(false); // Reset date ranges ready state
      fetchPackage();
      checkAgentStatus();
    }
  }, [packageSlug]);

  // Detect and validate referral code from URL params
  // Track if we've already validated this ref to prevent re-validation
  const validatedRefRef = useRef<string | null>(null);

  useEffect(() => {
    const ref = searchParams.get('ref');

    // Skip if no ref, already validated this ref, or already have referral data
    if (!ref || referralData || validatedRefRef.current === ref) return;

    // Only proceed if we have a valid-looking referral code
    // New format: r_[32 hex chars] or legacy: AGT-XXX-[16 hex]-[timestamp]
    const isValidFormat =
      /^r_[a-f0-9]{32}$/.test(ref) ||
      /^AGT-[A-Z0-9]+-[a-f0-9]{16}-[a-z0-9]+$/.test(ref);
    if (!isValidFormat) return;

    // Mark this ref as being validated to prevent duplicate calls
    validatedRefRef.current = ref;
    setReferralCode(ref);
    setReferralLoading(true);

    // Validate the referral code via API
    const validateReferral = async () => {
      try {
        const response = await fetch('/api/agent-referrals/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referralCode: ref,
            packageId: pkg?.package_id,
          }),
        });

        const result = await response.json();

        if (result.valid && result.referral) {
          setReferralData({
            id: result.referral.id,
            agentId: result.referral.agentId,
            agentName: result.referral.agentName,
            linkType: result.referral.linkType,
            discountPercentage: result.referral.discountPercentage || 0,
            showDiscount: result.referral.showDiscount || false,
          });

          // Show toast based on link type
          if (
            result.referral.linkType === 'discount' &&
            result.referral.discountPercentage > 0
          ) {
            toast.success(
              `You have a ${result.referral.discountPercentage}% discount via agent referral!`
            );
          }
        } else {
          // Invalid referral - clear it
          setReferralCode(null);
          if (result.error) {
            console.log('Referral validation failed:', result.error);
          }
        }
      } catch (error) {
        console.error('Error validating referral:', error);
        setReferralCode(null);
      } finally {
        setReferralLoading(false);
      }
    };

    validateReferral();
  }, [searchParams, pkg?.package_id, referralData]);

  useEffect(() => {
    if (pkg?.package_category_id) {
      fetchCategory();
    }
  }, [pkg?.package_category_id]);

  // Any-date packages open on the month holding the first bookable date
  // But only if no date is selected from URL params
  useEffect(() => {
    if (slug === 'flexible-date-packages' && pkg && pkg.package_id) {
      // Check if there's a date in URL params - if so, don't override the month
      const dateParam = searchParams.get('date');
      if (dateParam) {
        // Date will be set from URL params in another effect, skip setting month here
        return;
      }

      const firstBookable = getAnyDateEarliestBookable(pkg.start_date);
      setMonth(
        new Date(firstBookable.getFullYear(), firstBookable.getMonth(), 1)
      );
    }
  }, [slug, pkg?.package_id, pkg?.start_date, searchParams]);

  // Hotel surcharge ranges - these and the days before them are unbookable on any-date packages
  useEffect(() => {
    if (slug !== 'flexible-date-packages') return;
    let cancelled = false;

    const fetchSurcharges = async () => {
      try {
        const response = await fetch('/api/surcharge-master?limit=100&page=1');
        const result = await response.json();
        if (!cancelled && Array.isArray(result?.data)) {
          setSurcharges(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch surcharges:', error);
      }
    };

    fetchSurcharges();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Check if discount is active and calculate time left
  useEffect(() => {
    if (!pkg?.discount_start_date || !pkg?.discount_end_date) {
      setIsDiscountActive(false);
      setDiscountTimeLeft('');
      return;
    }

    // Check if any discount amount is set
    const hasDiscount =
      (pkg.adult_discount_amount && pkg.adult_discount_amount > 0) ||
      (pkg.child_discount_amount && pkg.child_discount_amount > 0) ||
      (pkg.infant_discount_amount && pkg.infant_discount_amount > 0);

    if (!hasDiscount) {
      setIsDiscountActive(false);
      setDiscountTimeLeft('');
      return;
    }

    const checkDiscount = () => {
      const now = new Date();
      const startDate = parseDateStringToLocal(pkg.discount_start_date!);
      const endDate = parseDateStringToLocal(pkg.discount_end_date!);

      if (!startDate || !endDate) {
        setIsDiscountActive(false);
        return;
      }

      // Set end date to end of day
      endDate.setHours(23, 59, 59, 999);

      const isActive = now >= startDate && now <= endDate;
      setIsDiscountActive(isActive);

      if (isActive) {
        // Calculate time left
        const diff = endDate.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (days > 0) {
          setDiscountTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        } else if (hours > 0) {
          setDiscountTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setDiscountTimeLeft(`${minutes}m ${seconds}s`);
        }
      } else {
        setDiscountTimeLeft('');
      }
    };

    checkDiscount();
    const interval = setInterval(checkDiscount, 1000);
    return () => clearInterval(interval);
  }, [
    pkg?.discount_start_date,
    pkg?.discount_end_date,
    pkg?.adult_discount_amount,
    pkg?.child_discount_amount,
    pkg?.infant_discount_amount,
  ]);

  // Detect user location and initialize exchange rate on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize exchange rate first (fetch from database)
        await initializeExchangeRate();
        // Detect location
        const location = await detectUserLocation();
        setUserLocation(location);
      } catch (error) {
        // Default to non-India
        const defaultLocation = {
          country: 'Unknown',
          countryCode: 'US',
          isIndia: false,
          currency: 'AED',
          currencySymbol: 'AED',
        };
        setUserLocation(defaultLocation);
      }
    };

    initialize();
  }, []);

  // Get available dates - the fixed date list used by dropdown-style categories
  const getAvailableDates = useCallback((): string[] => {
    /* Any-date packages have no fixed list of dates: the calendar decides what is
       bookable, so there is nothing to enumerate here. */
    if (slug === 'flexible-date-packages') {
      return [];
    }

    return getOfferPackageTravelDates(pkg?.travel_dates ?? null);
  }, [pkg?.travel_dates, slug]);

  const isPackageType = (): boolean => {
    return category?.packagetypeid === 1;
  };

  // Read query parameters and initialize state
  useEffect(() => {
    if (!pkg) return; // Wait for package to load

    const dateParam = searchParams.get('date');
    const adultsParam = searchParams.get('adults');
    const childrenParam = searchParams.get('children');

    // Initialize date
    if (dateParam) {
      const isPackage = category?.packagetypeid === 1;
      const isFlexibleDatePackage = slug === 'flexible-date-packages';

      if (isPackage) {
        // For packages (including flexible date packages), match with available dates
        const availableDates = getAvailableDates();
        const matchedDate = availableDates.find(d => d === dateParam);
        const dateToSet = matchedDate || dateParam;

        setSelectedDateString(dateToSet);

        // Also parse and set as Date object for calendar display
        const parsedDate = parseDateStringToLocal(dateToSet);
        if (parsedDate) {
          setSelectedDate(parsedDate);

          // Set month to show the selected date in calendar
          if (isFlexibleDatePackage) {
            setMonth(parsedDate);
          }
        }
      } else {
        // For tours, parse as Date object
        const date = parseDateStringToLocal(dateParam);
        if (date) {
          setSelectedDate(date);
          setMonth(date);
        }
      }
    }

    // Initialize persons
    const infantsParam = searchParams.get('infants');
    if (adultsParam || childrenParam || infantsParam) {
      setPersons({
        adult: adultsParam ? parseInt(adultsParam, 10) : 0,
        child: childrenParam ? parseInt(childrenParam, 10) : 0,
        infant: infantsParam ? parseInt(infantsParam, 10) : 0,
      });
    }
  }, [searchParams, pkg, category, slug, getAvailableDates, pkg?.date_ranges]);

  // Helper to get discounted price for a person type
  const getDiscountedPrice = useCallback(
    (
      basePrice: number | null | undefined,
      discountAmount: number | null | undefined
    ): number => {
      if (!basePrice) return 0;
      if (!isDiscountActive || !discountAmount) return basePrice;
      return Math.max(0, basePrice - discountAmount);
    },
    [isDiscountActive]
  );

  // Calculate visa price
  const getVisaPrice = useCallback((): number => {
    if (!pkg || !withVisa) return 0;
    let visaTotal = 0;
    if (pkg.adult_visa_price && visaForAdults > 0) {
      visaTotal += pkg.adult_visa_price * visaForAdults;
    }
    if (pkg.child_visa_price && visaForChildren > 0) {
      visaTotal += pkg.child_visa_price * visaForChildren;
    }
    if (pkg.infant_visa_price && visaForInfants > 0) {
      visaTotal += pkg.infant_visa_price * visaForInfants;
    }
    return visaTotal;
  }, [pkg, withVisa, visaForAdults, visaForChildren, visaForInfants]);

  // Get prices for selected date (for flexible date packages) or package base prices
  // The discount is applied AFTER getting these base prices, not here
  const getPricesForDate = useCallback((): {
    adultPrice: number;
    childPrice: number;
    infantPrice: number;
    soloTravellerPrice?: number | null;
  } => {
    let basePrices: {
      adultPrice: number;
      childPrice: number;
      infantPrice: number;
      soloTravellerPrice?: number | null;
    };

    /* Every category - any-date packages included - prices from the package's own
       per-person columns. Any-date packages no longer carry per-range pricing. */
    basePrices = {
      adultPrice: pkg?.adult_price || 0,
      childPrice: pkg?.child_price || 0,
      infantPrice: pkg?.infant_price || 0,
      soloTravellerPrice: pkg?.solo_traveller_price || null,
    };

    // Apply deal prices if active deal exists
    if (pkg?.active_deal) {
      const deal = pkg.active_deal;
      const now = new Date();
      const startDate = new Date(deal.start_date);
      const endDate = new Date(deal.end_date);

      // Check if deal is currently active
      if (deal.is_active && now >= startDate && now <= endDate) {
        return {
          adultPrice:
            deal.deal_adult_price !== null
              ? deal.deal_adult_price
              : basePrices.adultPrice,
          childPrice:
            deal.deal_child_price !== null
              ? deal.deal_child_price
              : basePrices.childPrice,
          infantPrice:
            deal.deal_infant_price !== null
              ? deal.deal_infant_price
              : basePrices.infantPrice,
          soloTravellerPrice:
            deal.deal_solo_traveller_price !== null
              ? deal.deal_solo_traveller_price
              : basePrices.soloTravellerPrice,
        };
      }
    }

    return basePrices;
  }, [pkg, pkg?.active_deal]);

  // Calculate price based on persons and selected date
  useEffect(() => {
    if (!pkg) {
      setCalculatedPrice(null);
      return;
    }

    // Solo traveller pricing overrides per-person pricing
    if (isSoloTraveller && pkg.solo_traveller_enabled) {
      const prices = getPricesForDate();
      // getPricesForDate already applies deal prices if active
      const soloPrice = prices.soloTravellerPrice ?? prices.adultPrice ?? 0;
      const visaPrice = getVisaPrice();
      const addonPrice = slug === 'offer-packages' ? addonPriceTotal : 0;
      let finalSoloPrice = soloPrice + visaPrice + addonPrice;
      if (hasActiveAgentSubscription && (pkg?.agent_discount ?? 0) > 0) {
        finalSoloPrice = Math.max(0, finalSoloPrice - (finalSoloPrice * (pkg.agent_discount ?? 0)) / 100);
      } else if (referralData?.linkType === 'discount' && (referralData?.discountPercentage ?? 0) > 0) {
        finalSoloPrice = Math.max(0, finalSoloPrice - (finalSoloPrice * (referralData.discountPercentage ?? 0)) / 100);
      }
      setCalculatedPrice(finalSoloPrice);
      return;
    }

    // Get prices for selected date (for flexible date packages) or package base prices
    const prices = getPricesForDate();

    // Apply discount if active (discounts apply to package-level prices, not date-specific)
    // For flexible date packages, we use date-specific prices without discount
    // For regular packages, apply discount to base prices
    let adultPrice = prices.adultPrice;
    let childPrice = prices.childPrice;
    let infantPrice = prices.infantPrice;

    // Only apply discount if not using date-specific pricing (i.e., regular packages)
    if (slug !== 'flexible-date-packages' && isDiscountActive) {
      adultPrice = pkg.adult_discount_amount
        ? getDiscountedPrice(prices.adultPrice, pkg.adult_discount_amount)
        : prices.adultPrice;
      childPrice = pkg.child_discount_amount
        ? getDiscountedPrice(prices.childPrice, pkg.child_discount_amount)
        : prices.childPrice;
      infantPrice = pkg.infant_discount_amount
        ? getDiscountedPrice(prices.infantPrice, pkg.infant_discount_amount)
        : prices.infantPrice;
    }

    // Calculate total price based on selected date and persons
    // For flexible date packages: use date-specific prices from date ranges
    // For other packages: use package base prices
    let totalPrice = 0;

    // Always use the prices from getPricesForDate() which handles date-specific pricing
    // For flexible date packages, getPricesForDate() returns prices from the selected date's range
    // For other packages, it returns package base prices
    totalPrice =
      (persons.adult > 0 ? persons.adult * adultPrice : 0) +
      (persons.child > 0 ? persons.child * childPrice : 0) +
      (persons.infant > 0 ? persons.infant * infantPrice : 0);

    // Only fall back to package_price if no per-person pricing and totalPrice is 0
    // This should only happen for non-flexible date packages
    if (
      totalPrice === 0 &&
      !pkg.adult_price &&
      !pkg.child_price &&
      !pkg.infant_price
    ) {
      totalPrice = pkg.package_price || 0;
    }

    // Add visa price (fetched from database: pkg.adult_visa_price, pkg.child_visa_price, pkg.infant_visa_price)
    const visaPrice = getVisaPrice();
    const addonPrice = slug === 'offer-packages' ? addonPriceTotal : 0;
    let finalPrice = totalPrice + visaPrice + addonPrice;

    // Apply discount logic:
    // Priority 1: Agent with active subscription gets agent discount
    // Priority 2: Customer via discount-type referral link gets referral discount
    // Note: These are mutually exclusive - agents can't use referral links

    let discountAmount = 0;
    const agentDiscountPercentage = pkg?.agent_discount || 0;

    // Check if user is an agent with active subscription
    const shouldApplyAgentDiscount =
      hasActiveAgentSubscription && agentDiscountPercentage > 0;

    // Check if customer came via discount-type referral link
    const shouldApplyReferralDiscount =
      !hasActiveAgentSubscription &&
      referralData?.linkType === 'discount' &&
      referralData?.discountPercentage > 0;

    if (shouldApplyAgentDiscount) {
      // Agent discount (for logged-in agents)
      setPriceBeforeAgentDiscount(finalPrice);
      discountAmount = (finalPrice * agentDiscountPercentage) / 100;
      finalPrice = Math.max(0, finalPrice - discountAmount);
      setAgentDiscountAmount(discountAmount);
      // Clear referral discount state
      setReferralDiscountAmount(null);
      setPriceBeforeReferralDiscount(null);
    } else if (shouldApplyReferralDiscount) {
      // Referral discount (for customers via discount-type referral link)
      setPriceBeforeReferralDiscount(finalPrice);
      discountAmount = (finalPrice * referralData.discountPercentage) / 100;
      finalPrice = Math.max(0, finalPrice - discountAmount);
      setReferralDiscountAmount(discountAmount);
      // Clear agent discount state
      setAgentDiscountAmount(null);
      setPriceBeforeAgentDiscount(null);
    } else {
      // No discount applies
      setAgentDiscountAmount(null);
      setPriceBeforeAgentDiscount(null);
      setReferralDiscountAmount(null);
      setPriceBeforeReferralDiscount(null);
    }

    setCalculatedPrice(finalPrice);
  }, [
    pkg,
    pkg?.date_ranges,
    persons.adult,
    persons.child,
    persons.infant,
    isSoloTraveller,
    isDiscountActive,
    getDiscountedPrice,
    getVisaPrice,
    getPricesForDate,
    slug,
    selectedDateString,
    selectedDate,
    hasActiveAgentSubscription,
    referralData,
    addonPriceTotal,
  ]);

  // Check if user is an agent
  const checkAgentStatus = async () => {
    try {
      const response = await fetch(
        '/api/agent-subscription/check-agent-status'
      );
      const result = await response.json();
      setIsAgent(result.isAgent || false);
      setHasActiveAgentSubscription(result.hasActiveSubscription || false);
    } catch (error) {
      console.error('Error checking agent status:', error);
      setIsAgent(false);
      setHasActiveAgentSubscription(false);
    }
  };

  const fetchPackage = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/packages/${packageSlug}`);
      const result = await response.json();

      if (result.data) {
        // Process and normalize all package data to ensure consistency
        const packageData = { ...result.data };

        // Parse date_ranges if it's a string (from JSONB column)
        if (packageData.date_ranges) {
          if (typeof packageData.date_ranges === 'string') {
            try {
              packageData.date_ranges = JSON.parse(packageData.date_ranges);
            } catch (e) {
              console.error('Error parsing date_ranges:', e);
              packageData.date_ranges = null;
            }
          }
          // Ensure it's an array
          if (!Array.isArray(packageData.date_ranges)) {
            packageData.date_ranges = null;
          }
        } else {
          packageData.date_ranges = null;
        }

        packageData.gallery = normalizePackageGallery(packageData.gallery);

        // Ensure with_visa is a boolean
        if (
          packageData.with_visa !== undefined &&
          packageData.with_visa !== null
        ) {
          packageData.with_visa = Boolean(packageData.with_visa);
        } else {
          packageData.with_visa = false;
        }

        // Ensure all numeric fields are properly set
        packageData.package_price = packageData.package_price || 0;
        packageData.adult_price = packageData.adult_price || 0;
        packageData.child_price = packageData.child_price || 0;
        packageData.infant_price = packageData.infant_price || 0;
        packageData.adult_visa_price = packageData.adult_visa_price || 0;
        packageData.child_visa_price = packageData.child_visa_price || 0;
        packageData.infant_visa_price = packageData.infant_visa_price || 0;
        packageData.agent_discount = packageData.agent_discount || 0;

        // Set package data - this will trigger re-renders of dependent components
        setPkg(packageData);
      } else {
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // Any-date packages no longer depend on configured ranges, so the calendar is
  // ready as soon as the package itself is loaded
  useEffect(() => {
    if (slug === 'flexible-date-packages') {
      setDateRangesReady(Boolean(pkg?.package_id));
    } else {
      // For non-flexible packages, mark as ready immediately
      setDateRangesReady(true);
    }
  }, [slug, pkg?.package_id]);

  // Pre-select default date for tours with special booking rules
  useEffect(() => {
    if (!pkg?.package_id) return;

    const weekendRule = getTourWeekendRangeRule(pkg.package_id);
    if (weekendRule) {
      const calendarMonth = getTourWeekendRangeInitialMonth(pkg.package_id);
      if (calendarMonth) setMonth(calendarMonth);

      const earliestBookable = getTourWeekendRangeEarliestBookable(
        pkg.package_id
      );

      const defaultDate = getTourDefaultWeekendRangeDate(
        pkg.package_id,
        earliestBookable
      );
      if (defaultDate) {
        const parsed = parseDateStringToLocal(defaultDate);
        if (parsed) setSelectedDate(parsed);
      }
      return;
    }

    const defaultDate = getTourDefaultFixedBookingDate(pkg.package_id);
    if (!defaultDate) return;
    const parsed = parseDateStringToLocal(defaultDate);
    if (parsed) setSelectedDate(parsed);
  }, [pkg?.package_id]);

  const fetchCategory = async () => {
    if (!pkg?.package_category_id) return;
    try {
      const response = await fetch('/api/package-categories?limit=100');
      const result = await response.json();
      if (result.data) {
        const foundCategory = result.data.find(
          (cat: any) => cat.id === pkg.package_category_id
        );
        setCategory(foundCategory);
      }
    } catch (error) {}
  };

  const updatePersonCount = (
    type: 'adult' | 'child' | 'infant',
    delta: number
  ) => {
    if (isSoloTraveller) return (prev: any) => prev;
    setPersons(prev => {
      // Get minimum adults from package (default to 1)
      const minAdults = pkg?.min_adults || 1;
      let newValue = prev[type] + delta;

      // Prevent negative values for children and infants
      if (type !== 'adult' && newValue < 0) {
        return prev;
      }

      // Enforce minimum adults from package setting
      if (type === 'adult' && newValue < minAdults) {
        toast.error(
          `This package requires a minimum of ${minAdults} adult${minAdults > 1 ? 's' : ''}`
        );
        return prev;
      }

      const updated = { ...prev, [type]: newValue };

      // Update visa counts if they exceed new person counts
      if (withVisa) {
        if (type === 'adult' && visaForAdults > newValue) {
          setVisaForAdults(newValue);
        } else if (type === 'child' && visaForChildren > newValue) {
          setVisaForChildren(newValue);
        } else if (type === 'infant' && visaForInfants > newValue) {
          setVisaForInfants(newValue);
        }
      }

      return updated;
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    // For flexible date packages, also set selectedDateString in 'yyyy-MM-dd' format
    if (date && slug === 'flexible-date-packages') {
      setSelectedDateString(format(date, 'yyyy-MM-dd'));
    }
  };

  // Check if a date falls within any booking slot (for UAE Tours only)
  const isDateInBookingSlot = (date: Date): boolean => {
    if (!pkg?.booking_slots || !Array.isArray(pkg.booking_slots)) return false;

    // Only apply to UAE tours - use slug from URL params
    if (!slug || !usesBookingSlots(slug)) return false;

    const dateToCheck = startOfDay(date);

    return pkg.booking_slots.some(slot => {
      const fromDate = startOfDay(new Date(slot.fromDate));
      const toDate = endOfDay(new Date(slot.toDate));
      return isWithinInterval(dateToCheck, { start: fromDate, end: toDate });
    });
  };

  // Get disabled dates for DayPicker (for UAE Tours and Flexible Date Packages)
  // Always show same sold out status and availability
  const getDisabledDates = (date: Date): boolean => {
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const checkDate = startOfDay(date);

    // Disable past dates
    if (checkDate < today) return true;

    const tourWeekendRangeRule = getTourWeekendRangeRule(pkg?.package_id);
    const onTourWeekendRange =
      tourWeekendRangeRule &&
      isDateOnTourWeekendRange(date, pkg?.package_id);
    const isExtraTourDate = isTourWeekendRangeExtraDate(
      date,
      pkg?.package_id
    );

    // For tours only: disable today and tomorrow (day after tomorrow earliest)
    // Exception: allowTodayBooking for today; extraDates bypass tomorrow block too
    if (slug && usesBookingSlots(slug)) {
      const allowToday = tourWeekendRangeRule?.allowTodayBooking === true;
      if (!allowToday && checkDate.getTime() === today.getTime()) return true;
      if (
        checkDate.getTime() === tomorrow.getTime() &&
        !isExtraTourDate
      ) {
        return true;
      }
      if (
        allowToday &&
        checkDate.getTime() === today.getTime() &&
        !onTourWeekendRange
      ) {
        return true;
      }
    }

    /* Any-date packages: every date is bookable except the lead window, dates
       outside the package start/end dates, dates marked sold out, and hotel
       surcharge dates (plus the configured days before each surcharge starts). */
    if (slug === 'flexible-date-packages') {
      return (
        getAnyDateBlockReason(date, {
          soldOutRanges: pkg?.date_ranges,
          surcharges,
          surchargeBlockDaysBefore: pkg?.surcharge_block_days_before,
          startDate: pkg?.start_date,
          endDate: pkg?.end_date,
        }) !== null
      );
    }

    // Only check booking slots and booking days for UAE tours - use slug from URL params
    if (!slug || !usesBookingSlots(slug)) {
      return false;
    }

    // Disable dates outside weekend-month rule, fixed allow-list, or weekday rules
    if (tourWeekendRangeRule) {
      if (!isDateOnTourWeekendRange(date, pkg?.package_id)) {
        return true;
      }
      // Explicit allow-list dates are not blocked by dashboard booking_slots
      return false;
    } else {
      const fixedBookingDates = getTourFixedBookingDates(pkg?.package_id);
      if (fixedBookingDates) {
        if (!fixedBookingDates.includes(format(date, 'yyyy-MM-dd'))) {
          return true;
        }
      } else if (!isDateOnTourBookingDay(date, pkg?.booking_days)) {
        return true;
      }
    }

    if (!pkg?.booking_slots || !Array.isArray(pkg.booking_slots)) {
      return false;
    }

    // Disable dates in booking slots
    return isDateInBookingSlot(date);
  };

  const handleDateStringSelect = (dateString: string) => {
    setSelectedDateString(dateString);
    const parsed = parseDateStringToLocal(dateString);
    setSelectedDate(parsed || undefined);
  };

  /** Checks the booking and hands it to checkout; false (with a toast) when something is missing. */
  const prepareBooking = (): boolean => {
    if (!pkg) return false;
    if (isPackagePriceRevealingSoon(pkg)) {
      toast.error('This package is not available for booking yet.');
      return false;
    }

    // Get date - REQUIRED for ALL packages
    const dateToUse = isPackageType()
      ? selectedDateString || null
      : selectedDate
        ? format(selectedDate, 'yyyy-MM-dd')
        : null;

    // Date is now required for ALL packages
    if (!dateToUse) {
      toast.error('Please select a date');
      return false;
    }

    /* Any-date packages: re-check the date, since a `?date=` query parameter can
       put a blocked date into state without going through the calendar. */
    if (slug === 'flexible-date-packages') {
      const parsedDate = parseDateStringToLocal(dateToUse);
      const blockReason = parsedDate
        ? getAnyDateBlockReason(parsedDate, {
            soldOutRanges: pkg.date_ranges,
            surcharges,
            surchargeBlockDaysBefore: pkg.surcharge_block_days_before,
            startDate: pkg.start_date,
            endDate: pkg.end_date,
          })
        : 'past';

      if (blockReason) {
        toast.error(
          blockReason === 'sold-out' || blockReason === 'surcharge'
            ? 'This date is not available. Please pick another date.'
            : 'Please select a valid travel date'
        );
        return false;
      }
    }

    // Get minimum adults requirement from package (default to 1)
    const minAdults = pkg.min_adults || 1;

    if (isSoloTraveller) {
      if (!soloTravellerGender) {
        toast.error('Please select gender for solo traveller');
        return false;
      }
      /* Only a shared room needs the sharing confirmation - a private room
         never shows it, so it cannot be required. */
      if (soloRoomType !== 'private' && !soloTravellerShareConsent) {
        toast.error('Please confirm sharing preference');
        return false;
      }
      /* A solo traveller booking is a deliberate 1-person booking priced at
         the package's own solo rate, so min_adults - which is the minimum for
         a normal shared booking - does not apply to it. The solo option is
         only offered when the package has solo_traveller_enabled, and the
         limited-time-deal page and checkout apply the same exemption. */
    } else {
      // Validate minimum adults based on package requirement
      if (persons.adult < minAdults) {
        toast.error(
          `This package requires a minimum of ${minAdults} adult${minAdults > 1 ? 's' : ''}`
        );
        return false;
      }

      // Validate total passengers (can't be 0)
      const totalPassengers = persons.adult + persons.child + persons.infant;
      if (totalPassengers === 0) {
        toast.error('Please select at least one passenger');
        return false;
      }
    }

    // When package has visa included at 0 price, visa block is hidden but we still pass visa data
    const hasVisaIncludedAtZero = hasVisaIncludedAtZeroPrice(pkg);
    const effectiveWithVisa = withVisa || hasVisaIncludedAtZero;
    const effectiveVisaForAdults = effectiveWithVisa
      ? hasVisaIncludedAtZero
        ? isSoloTraveller
          ? 1
          : persons.adult
        : visaForAdults
      : 0;
    const effectiveVisaForChildren = effectiveWithVisa
      ? hasVisaIncludedAtZero
        ? persons.child
        : visaForChildren
      : 0;
    const effectiveVisaForInfants = effectiveWithVisa
      ? hasVisaIncludedAtZero
        ? persons.infant
        : visaForInfants
      : 0;

    // Booking request (only identifiers, prices will be validated server-side)
    const bookingRequest: BookingRequest = {
      packageId: pkg.package_id,
      packageSlug: packageSlug,
      categorySlug: slug,
      adults: isSoloTraveller ? 1 : persons.adult,
      children: isSoloTraveller ? 0 : persons.child,
      infants: isSoloTraveller ? 0 : persons.infant,
      selectedDate: dateToUse || null, // Use null instead of undefined for offer packages
      isSoloTraveller,
      soloTravellerGender: isSoloTraveller ? soloTravellerGender : null,
      soloTravellerShareConsent: isSoloTraveller
        ? soloTravellerShareConsent
        : false,
      withVisa: effectiveWithVisa ? true : false,
      visaForAdults: effectiveVisaForAdults,
      visaForChildren: effectiveVisaForChildren,
      visaForInfants: effectiveVisaForInfants,
      // Include referral data if customer came via agent referral link
      // This data comes from server-side validation, NOT from URL params
      referralId: referralData?.id,
      referralCode: referralCode || undefined,
      referralDiscountApplied: referralData?.linkType === 'discount',
      referralDiscountPercentage: referralData?.discountPercentage,
      addonDeals:
        slug === 'offer-packages' && addonDeals.length > 0
          ? addonDeals
          : undefined,
      addonHotelServices:
        slug === 'offer-packages' && addonHotelServices.length > 0
          ? addonHotelServices
          : undefined,
      addonPrivateTransfers:
        slug === 'offer-packages' && addonPrivateTransfers.length > 0
          ? addonPrivateTransfers
          : undefined,
    };

    startBooking(bookingRequest);
    return true;
  };

  /** Book now: this one booking, straight to checkout. */
  const handleBookNow = () => {
    if (prepareBooking()) router.push('/checkout');
  };

  if (loading) return <PdpState loading />;

  if (!pkg) {
    return <PdpState title='Package not found' backHref={holidaysHref(slug)} />;
  }

  const images = getPackageGalleryImages(pkg.gallery, pkg.thumbnail_image);
  const prices = getPricesForDate();
  const isPriceRevealingSoon = isPackagePriceRevealingSoon(pkg);
  const type = typeForCategory(slug, category?.name || slug);
  const duration = durationLabel(pkg.package_days, pkg.package_nights);

  /* Discounts, exactly as the price effect above applies them: the limited-
     time amounts (not on any-date packages), then an agent's or a referral
     link's percentage off the whole booking. */
  const agentPct =
    hasActiveAgentSubscription && (pkg.agent_discount || 0) > 0
      ? pkg.agent_discount || 0
      : 0;
  const referralPct =
    !agentPct &&
    referralData?.linkType === 'discount' &&
    referralData.discountPercentage > 0
      ? referralData.discountPercentage
      : 0;
  const quote = buildQuote({
    solo: isSoloTraveller && !!pkg.solo_traveller_enabled,
    persons,
    prices,
    limited:
      slug !== 'flexible-date-packages' && isDiscountActive
        ? {
            adult: pkg.adult_discount_amount,
            child: pkg.child_discount_amount,
            infant: pkg.infant_discount_amount,
          }
        : null,
    packagePrice:
      !pkg.adult_price && !pkg.child_price && !pkg.infant_price
        ? pkg.package_price
        : null,
    visa: withVisa
      ? [
          { who: 'adult', count: visaForAdults, price: Number(pkg.adult_visa_price) || 0 },
          { who: 'child', count: visaForChildren, price: Number(pkg.child_visa_price) || 0 },
          { who: 'infant', count: visaForInfants, price: Number(pkg.infant_visa_price) || 0 },
        ]
      : [],
    extras: addonPriceTotal ? [{ label: 'Add-ons', amount: addonPriceTotal }] : [],
    pct: agentPct || referralPct,
    pctLabel: agentPct
      ? `Agent discount (${agentPct}%)`
      : referralPct
        ? `Special discount (${referralPct}%)`
        : null,
    showPct: agentPct > 0 || !!referralData?.showDiscount,
    total: calculatedPrice,
  });

  // same rule as checkout: tours, full-payment packages and agents pay in full
  const fullPaymentOnly =
    slug.toLowerCase().includes('tour') ||
    packageRequiresFullPayment(pkg) ||
    hasActiveAgentSubscription;
  const payNote =
    quote.total > 0 ? (
      fullPaymentOnly ? (
        'Full payment at checkout'
      ) : (
        <>
          Pay <b>{money(quote.total / 2)}</b> now, rest later
        </>
      )
    ) : null;

  const deal = pkg.active_deal;
  const now = new Date();
  const dealLive =
    !!deal?.is_active &&
    now >= new Date(deal.start_date) &&
    now <= new Date(deal.end_date);


  const whatsappText = `Hi, I have a question about ${pkg.package_name}${duration ? ` (${duration})` : ''}.`;

  return (
    <PdpShell
      images={images}
      name={pkg.package_name}
      duration={duration}
      kind={singular(type.label)}
      badge={
        dealLive
          ? 'Deal of the Day'
          : isDiscountActive
            ? 'Limited Time Offer'
            : soloOnly
              ? 'Solo Traveller'
              : null
      }
      inclusions={inclusionsOf(pkg as never, hasVisaIncludedAtZeroPrice(pkg))}
      notice={
        isDiscountActive && !isPriceRevealingSoon ? (
          <div className='pdp-offer' role='status'>
            <span className='pdp-offer__tag'>Limited time offer</span>
            <span className='pdp-offer__amts'>
              {(pkg.adult_discount_amount ?? 0) > 0 && (
                <span>
                  Adult <b>{money(pkg.adult_discount_amount)} off</b>
                </span>
              )}
              {(pkg.child_discount_amount ?? 0) > 0 && (
                <span>
                  Child <b>{money(pkg.child_discount_amount)} off</b>
                </span>
              )}
              {(pkg.infant_discount_amount ?? 0) > 0 && (
                <span>
                  Infant <b>{money(pkg.infant_discount_amount)} off</b>
                </span>
              )}
            </span>
            {discountTimeLeft ? (
              <span className='pdp-offer__timer'>
                Ends in <b>{discountTimeLeft}</b>
              </span>
            ) : null}
          </div>
        ) : null
      }
      copy={{
        overview: pkg.overview,
        description: pkg.package_description,
        holidayHtml: pkg.holiday_description_html,
        itinerary: pkg.itinerary,
        inclusionHtml: pkg.inclusion_html,
        exclusionHtml: pkg.exclusion_html,
        termsHtml: pkg.terms_html,
      }}
      notes={[
        {
          id: 'payment',
          title: 'Payment',
          body: (
            <p>
              {fullPaymentOnly
                ? 'This booking is paid in full at checkout.'
                : 'At checkout you can pay in full, or pay 50% now and the balance later.'}{' '}
              Prices are in AED.
            </p>
          ),
        },
        {
          id: 'cancellation',
          title: 'Cancellation policy',
          body: (
            <p>
              Cancellation charges depend on how close to travel you cancel.{' '}
              <Link href='/cancellation-policy'>Read the cancellation policy</Link>.
            </p>
          ),
        },
      ]}
      from={{ now: isPriceRevealingSoon ? null : quote.now || null, strike: quote.strike, basis: quote.basis }}
      sticky={{
        price: isPriceRevealingSoon ? 'Price revealing soon' : money(quote.total),
        sub: isPriceRevealingSoon
          ? pkg.package_name
          : `${quote.travellers} traveller${quote.travellers === 1 ? '' : 's'} · ${singular(type.label)}`,
      }}
      whatsappText={whatsappText}
      booking={
        <PackageBookingCard
          pkg={pkg}
          slug={slug}
          soloTravellerEnabled={pkg.solo_traveller_enabled || false}
          soloTravellerOnly={soloOnly}
          isSoloTraveller={isSoloTraveller}
          setIsSoloTraveller={setIsSoloTraveller}
          soloTravellerGender={soloTravellerGender}
          setSoloTravellerGender={setSoloTravellerGender}
          soloTravellerShareConsent={soloTravellerShareConsent}
          setSoloTravellerShareConsent={setSoloTravellerShareConsent}
          soloRoomType={soloRoomType}
          withVisa={withVisa}
          setWithVisa={setWithVisa}
          visaForAdults={visaForAdults}
          setVisaForAdults={setVisaForAdults}
          visaForChildren={visaForChildren}
          setVisaForChildren={setVisaForChildren}
          visaForInfants={visaForInfants}
          setVisaForInfants={setVisaForInfants}
          persons={persons}
          setPersons={setPersons}
          updatePersonCount={updatePersonCount}
          selectedDate={selectedDate}
          selectedDateString={selectedDateString}
          handleDateStringSelect={handleDateStringSelect}
          handleDateSelect={handleDateSelect}
          month={month}
          setMonth={setMonth}
          isPackageType={isPackageType}
          getAvailableDates={getAvailableDates}
          getDisabledDates={getDisabledDates}
          getPricesForDate={getPricesForDate}
          loading={loading}
          dateRangesReady={dateRangesReady}
          quote={quote}
          revealing={isPriceRevealingSoon}
          payNote={payNote}
          assurances={[
            ...(hasVisaIncludedAtZeroPrice(pkg) ? ['Visa included at no extra cost'] : []),
            ...(agentPct ? [`${agentPct}% agent discount applied`] : []),
            ...(referralPct && referralData?.showDiscount
              ? [`${referralPct}% discount from ${referralData.agentName || 'your agent'}`]
              : []),
            'Booking confirmation by email',
          ]}
          onBookNow={handleBookNow}
        />
      }
    />
  );
}
