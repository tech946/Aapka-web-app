'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart, CartItemStorage } from '@/context/CartContext';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Heart,
  MapPin,
  Calendar,
  Users,
  Star,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  X,
  ArrowUp,
  ChevronLeft,
  ShoppingCart,
  ShoppingCartIcon,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { DayPicker } from 'react-day-picker';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { usesBookingSlots, usesFlexibleDatePackages } from '@/lib/package-config';
import { FlexibleDateCalendar } from '@/components/marketing/FlexibleDateCalendar';
import BookingModal from '@/components/marketing/BookingModal';
import {
  detectUserLocation,
  initializeExchangeRate,
  type UserLocation,
} from '@/lib/location-utils';
import { parseDateStringToLocal, getEarliestAvailableDateMonth } from '@/lib/utils';
import { gsap } from 'gsap';
import 'react-day-picker/dist/style.css';
import '../../packages.css';
import './package-details.css';
import PackageGallery from './PackageGallery';
import PackageDetailsTabs from './PackageDetailsTabs';

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
  // Date ranges for flexible date packages (stored as JSONB in packages table)
  date_ranges?: DateRange[] | null;
  end_date?: string | null;
  thumbnail_image?: string | null;
  gallery?: string[] | null;
  created_at?: string | null;
}

export default function PackageDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  const slug = params?.slug as string;
  const packageSlug = params?.packageId as string;

  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRangesReady, setDateRangesReady] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [category, setCategory] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedDateString, setSelectedDateString] = useState<string>('');
  const [month, setMonth] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showPersonsDropdown, setShowPersonsDropdown] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [showDesktopPopover, setShowDesktopPopover] = useState(false);
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
  const [hasActiveAgentSubscription, setHasActiveAgentSubscription] = useState(false);
  
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
  const [referralDiscountAmount, setReferralDiscountAmount] = useState<number | null>(null);
  const [priceBeforeReferralDiscount, setPriceBeforeReferralDiscount] = useState<number | null>(null);

  // Initialize minimum adults based on package's min_adults setting
  // Skip this if solo traveller is selected (solo traveller should have 1 adult)
  useEffect(() => {
    if (isSoloTraveller) return; // Don't override solo traveller's 1 adult
    if (!pkg) return; // Wait for package to load
    
    const minAdults = pkg.min_adults || 1;
    if (persons.adult < minAdults) {
      setPersons(prev => ({ ...prev, adult: minAdults }));
    }
  }, [pkg?.min_adults, persons.adult, isSoloTraveller]);

  // Sync visaForAdults to 1 when solo traveller is selected
  useEffect(() => {
    if (isSoloTraveller && withVisa && visaForAdults !== 1) {
      setVisaForAdults(1);
      setVisaForChildren(0);
      setVisaForInfants(0);
    }
  }, [isSoloTraveller, withVisa, visaForAdults]);

  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [agentDiscountAmount, setAgentDiscountAmount] = useState<number | null>(null);
  const [priceBeforeAgentDiscount, setPriceBeforeAgentDiscount] = useState<number | null>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  // Note: Date ranges are now stored in pkg.date_ranges directly (no separate state needed)
  
  // Discount state
  const [isDiscountActive, setIsDiscountActive] = useState(false);
  const [discountTimeLeft, setDiscountTimeLeft] = useState<string>('');
  const isMobile = useIsMobile();

  const datePickerRef = useRef<HTMLDivElement>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const personsDropdownRef = useRef<HTMLDivElement>(null);
  const addToCartButtonRef = useRef<HTMLButtonElement>(null);
  const addToCartIconRef = useRef<SVGSVGElement>(null);

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
    const isValidFormat = /^r_[a-f0-9]{32}$/.test(ref) || /^AGT-[A-Z0-9]+-[a-f0-9]{16}-[a-z0-9]+$/.test(ref);
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
            packageId: pkg?.package_id 
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
          if (result.referral.linkType === 'discount' && result.referral.discountPercentage > 0) {
            toast.success(`You have a ${result.referral.discountPercentage}% discount via agent referral!`);
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

  // Set month to earliest available date when flexible date package loads
  // But only if no date is selected from URL params
  useEffect(() => {
    if (slug === 'flexible-date-packages' && pkg && pkg.package_id && pkg.date_ranges && Array.isArray(pkg.date_ranges) && pkg.date_ranges.length > 0) {
      // Check if there's a date in URL params - if so, don't override the month
      const dateParam = searchParams.get('date');
      if (dateParam) {
        // Date will be set from URL params in another effect, skip setting month here
        return;
      }
      
      const earliestMonth = getEarliestAvailableDateMonth(pkg.date_ranges);
      if (earliestMonth) {
        setMonth(earliestMonth);
      }
    }
  }, [slug, pkg?.package_id, pkg?.date_ranges, searchParams]);

  // Helper function to find the date range that contains a given date
  const findDateRangeForDate = useCallback((dateStr: string): DateRange | null => {
    if (!pkg?.date_ranges || !Array.isArray(pkg.date_ranges)) return null;
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0); // Normalize to midnight for accurate comparison
    
    // First check for sold out ranges (they take priority)
    for (const range of pkg.date_ranges) {
      if (!range.isSoldOut) continue;
      const fromDate = new Date(range.fromDate);
      const toDate = new Date(range.toDate);
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(0, 0, 0, 0);
      
      if (targetDate >= fromDate && targetDate <= toDate) {
        return range; // Return sold out range immediately
      }
    }
    
    // Then check for regular (non-sold-out) ranges
    for (const range of pkg.date_ranges) {
      if (range.isSoldOut) continue; // Skip sold out ranges (already checked)
      const fromDate = new Date(range.fromDate);
      const toDate = new Date(range.toDate);
      fromDate.setHours(0, 0, 0, 0);
      toDate.setHours(0, 0, 0, 0);
      
      if (targetDate >= fromDate && targetDate <= toDate) {
        return range;
      }
    }
    return null;
  }, [pkg?.date_ranges]);

  // Note: Flexible date data now comes from pkg.date_ranges (JSONB column in packages table)
  // No separate API fetch needed

  // Check if discount is active and calculate time left
  useEffect(() => {
    if (!pkg?.discount_start_date || !pkg?.discount_end_date) {
      setIsDiscountActive(false);
      setDiscountTimeLeft('');
      return;
    }

    // Check if any discount amount is set
    const hasDiscount = (pkg.adult_discount_amount && pkg.adult_discount_amount > 0) ||
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
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
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
  }, [pkg?.discount_start_date, pkg?.discount_end_date, pkg?.adult_discount_amount, pkg?.child_discount_amount, pkg?.infant_discount_amount]);

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

  // Get flexible date info from date_ranges - finds the range that contains the given date
  // Always show actual prices from date ranges
  const getFlexibleDateInfo = useCallback((dateStr: string): {
    adult_price: number;
    child_price: number;
    infant_price: number;
    solo_traveller_price?: number | null;
    is_sold_out: boolean;
  } | null => {
    const range = findDateRangeForDate(dateStr);
    if (!range) return null;
    // Always return actual prices from date ranges - no modification based on referral
    return {
      adult_price: range.adultPrice,
      child_price: range.childPrice,
      infant_price: range.infantPrice,
      solo_traveller_price: range.soloTravellerPrice,
      is_sold_out: range.isSoldOut,
    };
  }, [findDateRangeForDate]);

  // Get available dates - always show all dates from date ranges
  const getAvailableDates = useCallback((): string[] => {
    // For flexible date packages, generate all dates within the configured date ranges
    // Include ALL dates (both available and sold out) - the calendar will handle showing sold out status
    if (slug === 'flexible-date-packages' && pkg?.date_ranges && pkg.date_ranges.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sixDaysFromNow = new Date(today);
      sixDaysFromNow.setDate(sixDaysFromNow.getDate() + 6);

      const allDates: string[] = [];
      
      // Include ALL date ranges (both available and sold out)
      // The calendar component will handle showing sold out status
      for (const range of pkg.date_ranges) {
        const fromDate = new Date(range.fromDate);
        const toDate = new Date(range.toDate);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(0, 0, 0, 0);
        
        // Generate all dates in this range (including sold out ranges)
        const currentDate = new Date(fromDate);
        while (currentDate <= toDate) {
          if (currentDate > sixDaysFromNow) {
            allDates.push(format(currentDate, 'yyyy-MM-dd'));
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
      
      return [...new Set(allDates)].sort(); // Remove duplicates and sort
    }

    if (!pkg?.travel_dates) return [];
    if (Array.isArray(pkg.travel_dates)) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sixDaysFromNow = new Date(today);
      sixDaysFromNow.setDate(sixDaysFromNow.getDate() + 6);

      return pkg.travel_dates
        .map((d: any) => (typeof d === 'string' ? d : d.value))
        .filter((dateStr: string) => {
          const date = parseDateStringToLocal(dateStr);
          if (!date) return false;
          date.setHours(0, 0, 0, 0);
          // Only include dates that are more than 6 days from today (for all packages including offer packages)
          return date > sixDaysFromNow;
        });
    }
    return [];
  }, [pkg?.travel_dates, slug, pkg?.date_ranges]);

  const isPackageType = (): boolean => {
    return category?.packagetypeid === 1;
  };

  // Read query parameters and initialize state
  useEffect(() => {
    if (!pkg) return; // Wait for package to load
    // For flexible date packages, also wait for date_ranges to be loaded
    if (slug === 'flexible-date-packages' && (!pkg.date_ranges || !Array.isArray(pkg.date_ranges) || pkg.date_ranges.length === 0)) {
      return; // Wait for date ranges to be available
    }

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
  const getDiscountedPrice = useCallback((basePrice: number | null | undefined, discountAmount: number | null | undefined): number => {
    if (!basePrice) return 0;
    if (!isDiscountActive || !discountAmount) return basePrice;
    return Math.max(0, basePrice - discountAmount);
  }, [isDiscountActive]);

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

  // Get the minimum prices from all available date ranges (for showing "starting from" price)
  const getMinPricesFromRanges = useCallback((): { adultPrice: number; childPrice: number; infantPrice: number; soloTravellerPrice?: number | null } | null => {
    if (!pkg?.date_ranges || !Array.isArray(pkg.date_ranges) || pkg.date_ranges.length === 0) {
      return null;
    }
    // Find the minimum adult price from non-sold-out ranges
    const availableRanges = pkg.date_ranges.filter(r => !r.isSoldOut);
    if (availableRanges.length === 0) return null;
    
    // Get the range with minimum adult price
    const minRange = availableRanges.reduce((min, range) => 
      (range.adultPrice < min.adultPrice) ? range : min
    , availableRanges[0]);
    
    return {
      adultPrice: minRange.adultPrice || 0,
      childPrice: minRange.childPrice || 0,
      infantPrice: minRange.infantPrice || 0,
      soloTravellerPrice: minRange.soloTravellerPrice,
    };
  }, [pkg?.date_ranges]);

  // Get prices for selected date (for flexible date packages) or package base prices
  // The discount is applied AFTER getting these base prices, not here
  const getPricesForDate = useCallback((): { adultPrice: number; childPrice: number; infantPrice: number; soloTravellerPrice?: number | null } => {
    let basePrices: { adultPrice: number; childPrice: number; infantPrice: number; soloTravellerPrice?: number | null };
    
    // For flexible date packages, use date-specific pricing from date_ranges
    // Always return actual prices from date ranges
    if (slug === 'flexible-date-packages') {
      // Check if date is selected (either as string or Date object)
      const dateToCheck = selectedDateString || (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null);
      
      if (dateToCheck) {
        const dateInfo = getFlexibleDateInfo(dateToCheck);
        if (dateInfo) {
          // Use prices from the date range that contains this date
          // These are the actual prices - discount will be applied later if applicable
          basePrices = {
            adultPrice: dateInfo.adult_price || 0,
            childPrice: dateInfo.child_price || 0,
            infantPrice: dateInfo.infant_price || 0,
            soloTravellerPrice: dateInfo.solo_traveller_price,
          };
        } else {
          // If no date selected, show minimum price from available ranges as "starting from" price
          const minPrices = getMinPricesFromRanges();
          if (minPrices) {
            basePrices = {
              adultPrice: minPrices.adultPrice,
              childPrice: minPrices.childPrice,
              infantPrice: minPrices.infantPrice,
              soloTravellerPrice: minPrices.soloTravellerPrice,
            };
          } else {
            // Fallback to 0 if no ranges available
            basePrices = {
              adultPrice: 0,
              childPrice: 0,
              infantPrice: 0,
              soloTravellerPrice: null,
            };
          }
        }
      } else {
        // If no date selected, show minimum price from available ranges as "starting from" price
        const minPrices = getMinPricesFromRanges();
        if (minPrices) {
          basePrices = {
            adultPrice: minPrices.adultPrice,
            childPrice: minPrices.childPrice,
            infantPrice: minPrices.infantPrice,
            soloTravellerPrice: minPrices.soloTravellerPrice,
          };
        } else {
          // Fallback to 0 if no ranges available
          basePrices = {
            adultPrice: 0,
            childPrice: 0,
            infantPrice: 0,
            soloTravellerPrice: null,
          };
        }
      }
    } else {
      // For non-flexible date packages, use package base prices
      basePrices = {
        adultPrice: pkg?.adult_price || 0,
        childPrice: pkg?.child_price || 0,
        infantPrice: pkg?.infant_price || 0,
        soloTravellerPrice: pkg?.solo_traveller_price || null,
      };
    }

    // Apply deal prices if active deal exists
    if (pkg?.active_deal) {
      const deal = pkg.active_deal;
      const now = new Date();
      const startDate = new Date(deal.start_date);
      const endDate = new Date(deal.end_date);

      // Check if deal is currently active
      if (deal.is_active && now >= startDate && now <= endDate) {
        return {
          adultPrice: deal.deal_adult_price !== null ? deal.deal_adult_price : basePrices.adultPrice,
          childPrice: deal.deal_child_price !== null ? deal.deal_child_price : basePrices.childPrice,
          infantPrice: deal.deal_infant_price !== null ? deal.deal_infant_price : basePrices.infantPrice,
          soloTravellerPrice: deal.deal_solo_traveller_price !== null ? deal.deal_solo_traveller_price : basePrices.soloTravellerPrice,
        };
      }
    }

    return basePrices;
  }, [slug, selectedDateString, selectedDate, pkg, pkg?.date_ranges, pkg?.active_deal, getFlexibleDateInfo, getMinPricesFromRanges]);

  // Calculate original price (without discount)
  const getOriginalPrice = useCallback((): number | null => {
    if (!pkg) return null;
    if (isSoloTraveller && pkg.solo_traveller_enabled) {
      // For flexible date packages, get solo traveller price from date ranges
      if (slug === 'flexible-date-packages') {
        const prices = getPricesForDate();
        const soloPrice = prices.soloTravellerPrice ?? prices.adultPrice;
        return soloPrice ? soloPrice + getVisaPrice() : null;
      }
      // For non-flexible packages, use package-level solo traveller price
      const soloPrice = pkg.solo_traveller_price ?? pkg.package_price;
      return soloPrice ? soloPrice + getVisaPrice() : null;
    }
    const prices = getPricesForDate();
    const totalPrice =
      (persons.adult > 0 ? persons.adult * prices.adultPrice : 0) +
      (persons.child > 0 ? persons.child * prices.childPrice : 0) +
      (persons.infant > 0 ? persons.infant * prices.infantPrice : 0);
    const basePrice = totalPrice === 0 ? (pkg.package_price || 0) : totalPrice;
    return basePrice ? basePrice + getVisaPrice() : null;
  }, [pkg, persons.adult, persons.child, persons.infant, isSoloTraveller, getVisaPrice, getPricesForDate, slug]);

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
      setCalculatedPrice(soloPrice + visaPrice);
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
    if (totalPrice === 0 && slug !== 'flexible-date-packages' && !pkg.adult_price && !pkg.child_price && !pkg.infant_price) {
      totalPrice = pkg.package_price || 0;
    }
    
    // Add visa price (fetched from database: pkg.adult_visa_price, pkg.child_visa_price, pkg.infant_visa_price)
    const visaPrice = getVisaPrice();
    let finalPrice = totalPrice + visaPrice;
    
    // Apply discount logic:
    // Priority 1: Agent with active subscription gets agent discount
    // Priority 2: Customer via discount-type referral link gets referral discount
    // Note: These are mutually exclusive - agents can't use referral links
    
    let discountAmount = 0;
    const agentDiscountPercentage = pkg?.agent_discount || 0;
    
    // Check if user is an agent with active subscription
    const shouldApplyAgentDiscount = hasActiveAgentSubscription && agentDiscountPercentage > 0;
    
    // Check if customer came via discount-type referral link
    const shouldApplyReferralDiscount = !hasActiveAgentSubscription && 
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
  }, [pkg, pkg?.date_ranges, persons.adult, persons.child, persons.infant, isSoloTraveller, isDiscountActive, getDiscountedPrice, getVisaPrice, getPricesForDate, slug, selectedDateString, selectedDate, hasActiveAgentSubscription, referralData]);

  // Helper function to format price - always shows AED
  const formatPrice = (price: number | null): string => {
    if (price === null || price === undefined) return 'N/A';
    return `AED ${price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Check if user is an agent
  const checkAgentStatus = async () => {
    try {
      const response = await fetch('/api/agent-subscription/check-agent-status');
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
        
        // Ensure with_visa is a boolean
        if (packageData.with_visa !== undefined && packageData.with_visa !== null) {
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
  
  // Watch for date_ranges to become available (for flexible date packages)
  useEffect(() => {
    if (slug === 'flexible-date-packages') {
      if (pkg && pkg.date_ranges && Array.isArray(pkg.date_ranges) && pkg.date_ranges.length > 0) {
        setDateRangesReady(true);
      } else {
        setDateRangesReady(false);
      }
    } else {
      // For non-flexible packages, mark as ready immediately
      setDateRangesReady(true);
    }
  }, [slug, pkg?.date_ranges, pkg?.package_id]);

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

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
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
        toast.error(`This package requires a minimum of ${minAdults} adult${minAdults > 1 ? 's' : ''}`);
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

  const getTotalPersons = () => {
    return persons.adult + persons.child + persons.infant;
  };

  const getPersonsDisplayText = () => {
    if (isSoloTraveller) return '1 Traveller';
    const total = getTotalPersons();
    if (total === 0) return 'Persons';
    return `${total} ${total === 1 ? 'Person' : 'Persons'}`;
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    // For flexible date packages, also set selectedDateString in 'yyyy-MM-dd' format
    if (date && slug === 'flexible-date-packages') {
      setSelectedDateString(format(date, 'yyyy-MM-dd'));
    }
    if (date) {
      setShowDatePicker(false);
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

    // For tours only: disable today and tomorrow (tours can only be booked from day after tomorrow onwards)
    if (slug && usesBookingSlots(slug)) {
      // Disable today and tomorrow - tours can only be booked from day after tomorrow onwards
      if (checkDate.getTime() === today.getTime()) return true;
      if (checkDate.getTime() === tomorrow.getTime()) return true;
    }

    // For flexible date packages, check if date falls within a valid date range
    // Always use actual sold out status from date ranges - no modification based on referral
    if (slug === 'flexible-date-packages') {
      // Disable dates after package end_date
      if (pkg?.end_date) {
        const endDate = startOfDay(parseDateStringToLocal(pkg.end_date) || new Date(pkg.end_date));
        if (checkDate > endDate) return true;
      }

      const dateStr = format(date, 'yyyy-MM-dd');
      const dateInfo = getFlexibleDateInfo(dateStr);
      if (!dateInfo) return true; // Disable if date is not within any date range
      if (dateInfo.is_sold_out) return true; // Disable if the range is sold out - same for all users
      return false;
    }

    // Only check booking slots for UAE tours - use slug from URL params
    if (!slug || !usesBookingSlots(slug)) {
      return false;
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
    setShowDateDropdown(false);
  };

  const handleAddToCart = () => {
    if (!pkg) return;

    // Get date - REQUIRED for ALL packages
    const dateToUse = isPackageType()
      ? selectedDateString || null
      : selectedDate
        ? format(selectedDate, 'yyyy-MM-dd')
        : null;

    // Date is now required for ALL packages
    if (!dateToUse) {
      toast.error('Please select a date');
      return;
    }

    // Get minimum adults requirement from package (default to 1)
    const minAdults = pkg.min_adults || 1;

    if (isSoloTraveller) {
      if (!soloTravellerGender) {
        toast.error('Please select gender for solo traveller');
        return;
      }
      if (!soloTravellerShareConsent) {
        toast.error('Please confirm sharing preference');
        return;
      }
      // Solo traveller counts as 1 adult - check if package allows it
      if (minAdults > 1) {
        toast.error(`This package requires a minimum of ${minAdults} adults`);
        return;
      }
    } else {
      // Validate minimum adults based on package requirement
      if (persons.adult < minAdults) {
        toast.error(`This package requires a minimum of ${minAdults} adult${minAdults > 1 ? 's' : ''}`);
        return;
      }

      // Validate total passengers (can't be 0)
      const totalPassengers = persons.adult + persons.child + persons.infant;
      if (totalPassengers === 0) {
        toast.error('Please select at least one passenger');
        return;
      }
    }

    // Create cart item (only identifiers, prices will be validated server-side)
    const cartItem: CartItemStorage = {
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
      withVisa: withVisa ? true : false,
      visaForAdults: withVisa ? visaForAdults : 0,
      visaForChildren: withVisa ? visaForChildren : 0,
      visaForInfants: withVisa ? visaForInfants : 0,
      // Include referral data if customer came via agent referral link
      // This data comes from server-side validation, NOT from URL params
      referralId: referralData?.id,
      referralCode: referralCode || undefined,
      referralDiscountApplied: referralData?.linkType === 'discount',
      referralDiscountPercentage: referralData?.discountPercentage,
    };

    addToCart(cartItem);
    toast.success('Package added to cart!');

    // Close drawer on mobile after adding to cart
    if (isMobile) {
      setShowMobileDrawer(false);
    }

    // Close popover on desktop after adding to cart
    if (!isMobile) {
      setShowDesktopPopover(false);
    }
  };

  const handleMobileAddToCartClick = () => {
    setShowMobileDrawer(true);
  };


  // Scroll to top button visibility and scrollbar visibility
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 300);

      // Add class to body when scrolling to show scrollbar
      document.body.classList.add('is-scrolling');

      // Clear existing timeout
      clearTimeout(scrollTimeout);

      // Remove class after scrolling stops (500ms delay)
      scrollTimeout = setTimeout(() => {
        document.body.classList.remove('is-scrolling');
      }, 500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);


  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  // GSAP hover animations for Add to Cart button
  useEffect(() => {
    const button = addToCartButtonRef.current;
    const icon = addToCartIconRef.current;
    
    if (!button) return;

    const handleMouseEnter = () => {
      gsap.to(button, {
        scale: 1.05,
        y: -3,
        boxShadow: '0 12px 32px -4px rgba(253, 107, 6, 0.6)',
        background: 'linear-gradient(135deg, #ff7a1a 0%, #fd6b06 100%)',
        duration: 0.4,
        ease: 'power2.out',
      });
      
      if (icon) {
        gsap.to(icon, {
          scale: 1.15,
          rotation: -8,
          duration: 0.4,
          ease: 'back.out(1.7)',
        });
      }

    };

    const handleMouseLeave = () => {
      gsap.to(button, {
        scale: 1,
        y: 0,
        boxShadow: '0 4px 14px -2px rgba(253, 107, 6, 0.4)',
        background: 'linear-gradient(135deg, #fd6b06 0%, #e64500 100%)',
        duration: 0.3,
        ease: 'power2.out',
      });
      
      if (icon) {
        gsap.to(icon, {
          scale: 1,
          rotation: 0,
          duration: 0.3,
          ease: 'power2.out',
        });
      }

   
    };

    const handleMouseDown = () => {
      gsap.to(button, {
        scale: 0.97,
        y: 0,
        duration: 0.1,
        ease: 'power2.out',
      });
    };

    const handleMouseUp = () => {
      gsap.to(button, {
        scale: 1.05,
        y: -3,
        duration: 0.2,
        ease: 'back.out(1.7)',
      });
    };

    button.addEventListener('mouseenter', handleMouseEnter);
    button.addEventListener('mouseleave', handleMouseLeave);
    button.addEventListener('mousedown', handleMouseDown);
    button.addEventListener('mouseup', handleMouseUp);

    return () => {
      button.removeEventListener('mouseenter', handleMouseEnter);
      button.removeEventListener('mouseleave', handleMouseLeave);
      button.removeEventListener('mousedown', handleMouseDown);
      button.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Click outside handlers for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(target)
      ) {
        setShowDatePicker(false);
      }
      if (
        dateDropdownRef.current &&
        !dateDropdownRef.current.contains(target)
      ) {
        setShowDateDropdown(false);
      }
      if (
        personsDropdownRef.current &&
        !personsDropdownRef.current.contains(target)
      ) {
        setShowPersonsDropdown(false);
      }
    };

    // Use mousedown for desktop and touchstart for mobile
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);


  if (loading) {
    return (
      <div className='package-details-page'>
        <div className='package-details-loading'>
          Loading package details...
        </div>
      </div>
    );
  }

  if (!pkg) {
    return (
      <div className='package-details-page'>
        <div className='package-details-error'>
          <h2>Package not found</h2>
          <Link href={`/category/${slug}`} className='back-button'>
            <ArrowLeft /> Back to packages
          </Link>
        </div>
      </div>
    );
  }

  // Get images array
  const images = (pkg.gallery && Array.isArray(pkg.gallery) && pkg.gallery.length > 0)
    ? pkg.gallery
    : (pkg.thumbnail_image && pkg.thumbnail_image.trim() ? [pkg.thumbnail_image] : []);

  // Calculate pricing for display
  const prices = getPricesForDate();
  const hasPricing = prices.adultPrice > 0 || prices.childPrice > 0 || prices.infantPrice > 0;
  const currentPrice = calculatedPrice !== null ? calculatedPrice : (hasPricing ? 0 : (pkg.package_price || 0));
  const originalPrice = getOriginalPrice();
  
  // Determine which discount applies for display
  const hasAnyDiscount = (hasActiveAgentSubscription && agentDiscountAmount && agentDiscountAmount > 0) || 
                         (referralData?.showDiscount && referralDiscountAmount && referralDiscountAmount > 0);
  const showOriginalPrice = (isDiscountActive && originalPrice !== null && originalPrice !== currentPrice) || hasAnyDiscount;
  const displayOriginalPrice = priceBeforeAgentDiscount || priceBeforeReferralDiscount || originalPrice;
  
  // Get discount info for display
  const discountLabel = hasActiveAgentSubscription && agentDiscountAmount 
    ? `Agent Discount (${pkg.agent_discount}%)`
    : referralData?.showDiscount && referralDiscountAmount
    ? `Special Discount (${referralData.discountPercentage}%)`
    : null;

  return (
    <div className='package-details-page'>
      {/* Gallery and Product Details Section */}
      <div className='package-hero-section'>
        {/* Gallery on Left */}
        <PackageGallery images={images} packageName={pkg.package_name} />

        {/* Product Details on Right */}
        <div className='package-hero-details'>
          <h1 className='package-hero-title'>{pkg.package_name}</h1>
          
          <div className='package-hero-pricing'>
            <span className='package-hero-price-current'>
              {formatPrice(currentPrice)}
            </span>
            {showOriginalPrice && displayOriginalPrice && (
              <span className='package-hero-price-original'>
                {formatPrice(displayOriginalPrice)}
              </span>
            )}
            {discountLabel && (
              <span className='package-hero-discount-badge'>
                {discountLabel}
              </span>
            )}
      </div>

          {pkg.package_description && (
            <p className='package-hero-description'>{pkg.package_description}</p>
          )}

          {/* Price Breakdown */}
      {(() => {
        const prices = getPricesForDate();
        const hasPricing = prices.adultPrice > 0 || prices.childPrice > 0 || prices.infantPrice > 0;
        
        if (!hasPricing && !pkg.package_price) return null;
        
        // Calculate discounted prices if referral discount is active
        const referralDiscountPercent = referralData?.linkType === 'discount' && referralData?.discountPercentage > 0 && !hasActiveAgentSubscription
          ? referralData.discountPercentage
          : 0;
        const agentDiscountPercent = hasActiveAgentSubscription && (pkg?.agent_discount || 0) > 0
          ? (pkg?.agent_discount || 0)
          : 0;
        const discountPercent = agentDiscountPercent || referralDiscountPercent;
        
        const getDiscountedUnitPrice = (price: number) => {
          if (discountPercent <= 0) return price;
          return Math.max(0, price - (price * discountPercent / 100));
        };
        
        return (
              <div className='package-hero-price-breakdown'>
                {prices.adultPrice > 0 && (
                  <div className='package-hero-price-item'>
                    <span className='package-hero-price-item-label'>Adult</span>
                    <span className='package-hero-price-item-age'>12+ Years</span>
                    {discountPercent > 0 ? (
                      <>
                        <span className='package-hero-price-item-amount discounted'>
                          {formatPrice(getDiscountedUnitPrice(prices.adultPrice))}
                        </span>
                        <span className='package-hero-price-item-original'>
                          {formatPrice(prices.adultPrice)}
                        </span>
                      </>
                    ) : (
                      <span className='package-hero-price-item-amount'>
                        {formatPrice(prices.adultPrice)}
                      </span>
                    )}
                    {isDiscountActive && pkg.adult_discount_amount && pkg.adult_discount_amount > 0 && (
                      <span className='package-hero-price-item-discount'>
                        Save {formatPrice(pkg.adult_discount_amount)}
                      </span>
                    )}
                  </div>
                )}
                {prices.childPrice > 0 && (
                  <div className='package-hero-price-item'>
                    <span className='package-hero-price-item-label'>Child</span>
                    <span className='package-hero-price-item-age'>2-8 Years</span>
                    {discountPercent > 0 ? (
                      <>
                        <span className='package-hero-price-item-amount discounted'>
                          {formatPrice(getDiscountedUnitPrice(prices.childPrice))}
                        </span>
                        <span className='package-hero-price-item-original'>
                          {formatPrice(prices.childPrice)}
                        </span>
                      </>
                    ) : (
                      <span className='package-hero-price-item-amount'>
                        {formatPrice(prices.childPrice)}
                      </span>
                    )}
                    {isDiscountActive && pkg.child_discount_amount && pkg.child_discount_amount > 0 && (
                      <span className='package-hero-price-item-discount'>
                        Save {formatPrice(pkg.child_discount_amount)}
                      </span>
                    )}
                  </div>
                )}
                {prices.infantPrice > 0 && (
                  <div className='package-hero-price-item'>
                    <span className='package-hero-price-item-label'>Infant</span>
                    <span className='package-hero-price-item-age'>&lt;2 Years</span>
                    {discountPercent > 0 ? (
                      <>
                        <span className='package-hero-price-item-amount discounted'>
                          {formatPrice(getDiscountedUnitPrice(prices.infantPrice))}
                        </span>
                        <span className='package-hero-price-item-original'>
                          {formatPrice(prices.infantPrice)}
                        </span>
                      </>
                    ) : (
                      <span className='package-hero-price-item-amount'>
                        {formatPrice(prices.infantPrice)}
                      </span>
                    )}
                    {isDiscountActive && pkg.infant_discount_amount && pkg.infant_discount_amount > 0 && (
                      <span className='package-hero-price-item-discount'>
                        Save {formatPrice(pkg.infant_discount_amount)}
                      </span>
                    )}
                  </div>
                )}
                {!hasPricing && pkg.package_price && (
                  <div className='package-hero-price-item'>
                    <span className='package-hero-price-item-label'>Package Price</span>
                    {discountPercent > 0 ? (
                      <>
                        <span className='package-hero-price-item-amount discounted'>
                          {formatPrice(getDiscountedUnitPrice(pkg.package_price))}
                        </span>
                        <span className='package-hero-price-item-original'>
                          {formatPrice(pkg.package_price)}
                        </span>
                      </>
                    ) : (
                      <span className='package-hero-price-item-amount'>
                        {formatPrice(pkg.package_price)}
                      </span>
                    )}
                  </div>
                )}
          </div>
        );
      })()}

          <button
            ref={addToCartButtonRef}
            className='package-hero-add-to-cart-button'
            onClick={() => {
              if (isMobile) {
                setShowMobileDrawer(true);
              } else {
                setShowDesktopPopover(true);
              }
            }}
          >
            <ShoppingCartIcon ref={addToCartIconRef} size={24} />
            Add to Cart
          </button>
                  </div>
      </div>


      {/* Discount Banner */}
      {isDiscountActive && (
        <div className='discount-banner'>
          <div className='discount-banner-content'>
            <div className='discount-badge'>
              <img src='/images/disocunt-ignite.svg' alt='Discount' className='discount-icon' />
              <span className='discount-label'>Limited Time Offer!</span>
            </div>
            <div className='discount-details'>
              <div className='discount-amounts'>
                {pkg.adult_discount_amount && pkg.adult_discount_amount > 0 && (
                  <span className='discount-item'>
                    Adult: <strong>AED {pkg.adult_discount_amount} OFF</strong>
                  </span>
                )}
                {pkg.child_discount_amount && pkg.child_discount_amount > 0 && (
                  <span className='discount-item'>
                    Child: <strong>AED {pkg.child_discount_amount} OFF</strong>
                  </span>
                )}
                {pkg.infant_discount_amount && pkg.infant_discount_amount > 0 && (
                  <span className='discount-item'>
                    Infant: <strong>AED {pkg.infant_discount_amount} OFF</strong>
                  </span>
                )}
              </div>
              <div className='discount-timer'>
                <span className='timer-label'>Ends in:</span>
                <span className='timer-value'>{discountTimeLeft}</span>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Main Content with Tabs */}
      <PackageDetailsTabs pkg={pkg} />

      {/* Booking Modal */}
      <BookingModal
        isOpen={isMobile ? showMobileDrawer : showDesktopPopover}
        onClose={() => {
          if (isMobile) {
            setShowMobileDrawer(false);
                          } else {
            setShowDesktopPopover(false);
                          }
        }}
        isMobile={isMobile}
        pkg={pkg}
        slug={slug}
        soloTravellerEnabled={pkg.solo_traveller_enabled || false}
        isSoloTraveller={isSoloTraveller}
        setIsSoloTraveller={setIsSoloTraveller}
        soloTravellerGender={soloTravellerGender}
        setSoloTravellerGender={setSoloTravellerGender}
        soloTravellerShareConsent={soloTravellerShareConsent}
        setSoloTravellerShareConsent={setSoloTravellerShareConsent}
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
        getPersonsDisplayText={getPersonsDisplayText}
                            selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedDateString={selectedDateString}
        handleDateStringSelect={handleDateStringSelect}
        handleDateSelect={handleDateSelect}
                            month={month}
        setMonth={setMonth}
        showPersonsDropdown={showPersonsDropdown}
        setShowPersonsDropdown={setShowPersonsDropdown}
        showDateDropdown={showDateDropdown}
        setShowDateDropdown={setShowDateDropdown}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        personsDropdownRef={personsDropdownRef}
        dateDropdownRef={dateDropdownRef}
        datePickerRef={datePickerRef}
        isPackageType={isPackageType}
        getAvailableDates={getAvailableDates}
        getDisabledDates={getDisabledDates}
        getPricesForDate={getPricesForDate}
        formatPrice={formatPrice}
        getOriginalPrice={getOriginalPrice}
        calculatedPrice={calculatedPrice}
        isDiscountActive={isDiscountActive}
        hasActiveAgentSubscription={hasActiveAgentSubscription}
        agentDiscountAmount={agentDiscountAmount}
        priceBeforeAgentDiscount={priceBeforeAgentDiscount}
        loading={loading}
        dateRangesReady={dateRangesReady}
        handleAddToCart={handleAddToCart}
      />

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <button
          className='scroll-to-top-button'
          onClick={scrollToTop}
          aria-label='Scroll to top'
        >
          <ArrowUp className='scroll-to-top-icon' />
        </button>
      )}
    </div>
  );
}
