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
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { DayPicker } from 'react-day-picker';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { usesBookingSlots, usesFlexibleDatePackages } from '@/lib/package-config';
import useEmblaCarousel from 'embla-carousel-react';
import { FlexibleDateCalendar } from '@/components/marketing/FlexibleDateCalendar';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  detectUserLocation,
  initializeExchangeRate,
  type UserLocation,
} from '@/lib/location-utils';
import { parseDateStringToLocal } from '@/lib/utils';
import 'react-day-picker/dist/style.css';
import '../../packages.css';
import './package-details.css';

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
  // Discount fields
  adult_discount_amount?: number | null;
  child_discount_amount?: number | null;
  infant_discount_amount?: number | null;
  discount_start_date?: string | null;
  discount_end_date?: string | null;
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
  end_date?: string | null;
  thumbnail_image?: string | null;
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
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
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

  // Initialize minimum adults: 1 for all packages, 2 for offer packages
  useEffect(() => {
    if (slug === 'offer-packages' && persons.adult < 2) {
      setPersons(prev => ({ ...prev, adult: 2 }));
    } else if (persons.adult < 1) {
      setPersons(prev => ({ ...prev, adult: 1 }));
    }
  }, [slug]);
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [expandedItineraryItems, setExpandedItineraryItems] = useState<
    Set<number>
  >(new Set());
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  // Flexible date availability data
  const [flexibleDateAvailability, setFlexibleDateAvailability] = useState<
    Array<{
      date: string;
      adult_price: number;
      child_price: number;
      infant_price: number;
      available_seats: number;
      is_sold_out: boolean;
    }>
  >([]);
  
  // Discount state
  const [isDiscountActive, setIsDiscountActive] = useState(false);
  const [discountTimeLeft, setDiscountTimeLeft] = useState<string>('');
  const isMobile = useIsMobile();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: false,
    skipSnaps: false,
    duration: 25,
  });

  const datePickerRef = useRef<HTMLDivElement>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const personsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (packageSlug) {
      fetchPackage();
    }
  }, [packageSlug]);

  useEffect(() => {
    if (pkg?.package_category_id) {
      fetchCategory();
    }
  }, [pkg?.package_category_id]);

  // Fetch flexible date availability if this is a flexible date package
  useEffect(() => {
    if (pkg?.package_id && slug === 'flexible-date-packages') {
      fetchFlexibleDateAvailability();
    }
  }, [pkg?.package_id, slug]);

  const fetchFlexibleDateAvailability = async () => {
    if (!pkg?.package_id) return;
    try {
      const response = await fetch(
        `/api/package-date-availability?package_id=${pkg.package_id}`
      );
      const result = await response.json();
      if (result.data && Array.isArray(result.data)) {
        setFlexibleDateAvailability(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch flexible date availability:', error);
    }
  };

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
          setDiscountTimeLeft(`${days}d ${hours}h ${minutes}m`);
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

  const getAvailableDates = useCallback((): string[] => {
    // For flexible date packages, get dates from availability data
    if (slug === 'flexible-date-packages' && flexibleDateAvailability.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sixDaysFromNow = new Date(today);
      sixDaysFromNow.setDate(sixDaysFromNow.getDate() + 6);

      return flexibleDateAvailability
        .filter(avail => {
          const date = parseDateStringToLocal(avail.date);
          if (!date) return false;
          date.setHours(0, 0, 0, 0);
          return date > sixDaysFromNow && !avail.is_sold_out && avail.available_seats > 0;
        })
        .map(avail => avail.date);
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
  }, [pkg?.travel_dates, slug, flexibleDateAvailability]);

  // Get flexible date availability for a specific date
  const getFlexibleDateInfo = (dateStr: string) => {
    return flexibleDateAvailability.find(avail => avail.date === dateStr);
  };

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

      if (isPackage) {
        // For packages, match with available dates
        const availableDates = getAvailableDates();
        const matchedDate = availableDates.find(d => d === dateParam);
        if (matchedDate) {
          setSelectedDateString(matchedDate);
        } else {
          // Try to parse as date string format
          setSelectedDateString(dateParam);
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
  }, [searchParams, pkg, category, getAvailableDates]);

  // Helper to get discounted price for a person type
  const getDiscountedPrice = useCallback((basePrice: number | null | undefined, discountAmount: number | null | undefined): number => {
    if (!basePrice) return 0;
    if (!isDiscountActive || !discountAmount) return basePrice;
    return Math.max(0, basePrice - discountAmount);
  }, [isDiscountActive]);

  // Calculate original price (without discount)
  const getOriginalPrice = useCallback((): number | null => {
    if (!pkg) return null;
    if (isSoloTraveller && pkg.solo_traveller_enabled) {
      return pkg.solo_traveller_price ?? pkg.package_price;
    }
    const totalPrice =
      (persons.adult > 0 && pkg.adult_price ? persons.adult * pkg.adult_price : 0) +
      (persons.child > 0 && pkg.child_price ? persons.child * pkg.child_price : 0) +
      (persons.infant > 0 && pkg.infant_price ? persons.infant * pkg.infant_price : 0);
    return totalPrice === 0 ? pkg.package_price : totalPrice;
  }, [pkg, persons.adult, persons.child, persons.infant, isSoloTraveller]);

  // Calculate price based on persons
  useEffect(() => {
    if (!pkg) {
      setCalculatedPrice(null);
      return;
    }

    // Solo traveller pricing overrides per-person pricing
    if (isSoloTraveller && pkg.solo_traveller_enabled) {
      setCalculatedPrice(pkg.solo_traveller_price ?? pkg.package_price);
      return;
    }

    // Apply discount if active
    const adultPrice = isDiscountActive && pkg.adult_discount_amount
      ? getDiscountedPrice(pkg.adult_price, pkg.adult_discount_amount)
      : (pkg.adult_price || 0);
    const childPrice = isDiscountActive && pkg.child_discount_amount
      ? getDiscountedPrice(pkg.child_price, pkg.child_discount_amount)
      : (pkg.child_price || 0);
    const infantPrice = isDiscountActive && pkg.infant_discount_amount
      ? getDiscountedPrice(pkg.infant_price, pkg.infant_discount_amount)
      : (pkg.infant_price || 0);

    const totalPrice =
      (persons.adult > 0 ? persons.adult * adultPrice : 0) +
      (persons.child > 0 ? persons.child * childPrice : 0) +
      (persons.infant > 0 ? persons.infant * infantPrice : 0);

    // If no persons selected or no adult/child prices, use base price
    if (totalPrice === 0) {
      setCalculatedPrice(pkg.package_price);
    } else {
      setCalculatedPrice(totalPrice);
    }
  }, [pkg, persons.adult, persons.child, persons.infant, isSoloTraveller, isDiscountActive, getDiscountedPrice]);

  // Helper function to format price - always shows AED
  const formatPrice = (price: number | null): string => {
    if (!price) return 'N/A';
    return `AED ${price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const fetchPackage = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/packages/${packageSlug}`);
      const result = await response.json();

      if (result.data) {
        setPkg(result.data);
      } else {
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

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
    if (isSoloTraveller) return prev => prev;
    setPersons(prev => {
      const isOfferPackage = slug === 'offer-packages';
      let newValue = prev[type] + delta;

      // Prevent negative values for children and infants
      if (type !== 'adult' && newValue < 0) {
        return prev;
      }

      // For offer packages, ensure minimum 2 adults
      if (isOfferPackage && type === 'adult') {
        if (newValue < 2) {
          toast.error('Offer packages require a minimum of 2 adults');
          return prev;
        }
      } else if (type === 'adult' && newValue < 1) {
        // For all other packages, minimum 1 adult
        toast.error('At least 1 adult is required');
        return prev;
      }

      return { ...prev, [type]: newValue };
    });
  };

  const getTotalPersons = () => {
    return persons.adult + persons.child + persons.infant;
  };

  const getPersonsDisplayText = () => {
    if (isSoloTraveller) return 'Solo Traveller';
    const total = getTotalPersons();
    if (total === 0) return 'Persons';
    return `${total} ${total === 1 ? 'Person' : 'Persons'}`;
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
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
  const getDisabledDates = (date: Date): boolean => {
    const today = startOfDay(new Date());
    const checkDate = startOfDay(date);

    // Disable past dates
    if (checkDate < today) return true;

    // For flexible date packages, check availability and end_date
    if (slug === 'flexible-date-packages') {
      // Disable dates after package end_date
      if (pkg?.end_date) {
        const endDate = startOfDay(parseDateStringToLocal(pkg.end_date) || new Date(pkg.end_date));
        if (checkDate > endDate) return true;
      }

      const dateStr = format(date, 'yyyy-MM-dd');
      const availInfo = getFlexibleDateInfo(dateStr);
      if (!availInfo) return true; // Disable if not in availability
      if (availInfo.is_sold_out || availInfo.available_seats <= 0) return true; // Disable if sold out
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

    // For offer packages, date is optional but can be selected
    const isOfferPackage = slug === 'offer-packages';

    // Get date (optional for offer packages, required for others)
    const dateToUse = isPackageType()
      ? selectedDateString || null
      : selectedDate
        ? format(selectedDate, 'yyyy-MM-dd')
        : null;

    // Date is required for non-offer packages
    if (!isOfferPackage && !dateToUse) {
      toast.error('Please select a date');
      return;
    }

    if (isSoloTraveller) {
      if (!soloTravellerGender) {
        toast.error('Please select gender for solo traveller');
        return;
      }
      if (!soloTravellerShareConsent) {
        toast.error('Please confirm sharing preference');
        return;
      }
    } else {
      // Validate that at least one adult is selected
      if (persons.adult === 0) {
        toast.error('At least 1 adult is required');
        return;
      }

      // Validate total passengers (can't be 0)
      const totalPassengers = persons.adult + persons.child + persons.infant;
      if (totalPassengers === 0) {
        toast.error('Please select at least one passenger');
        return;
      }

      // Validate minimum 2 adults for offer packages
      if (isOfferPackage && persons.adult < 2) {
        toast.error('Offer packages require a minimum of 2 adults');
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

  // Get tabs based on available content
  const getTabs = () => {
    const tabs: Array<{ id: string; label: string }> = [];
    if (pkg?.overview) tabs.push({ id: 'overview', label: 'Overview' });
    if (pkg?.package_description)
      tabs.push({ id: 'description', label: 'Description' });
    if (pkg?.holiday_description_html)
      tabs.push({ id: 'holiday', label: 'Holiday Description' });
    if (pkg?.itinerary && pkg.itinerary.length > 0)
      tabs.push({ id: 'itinerary', label: 'Itinerary' });
    if (pkg?.inclusion_html)
      tabs.push({ id: 'inclusions', label: 'Inclusions' });
    if (pkg?.exclusion_html)
      tabs.push({ id: 'exclusions', label: 'Exclusions' });
    if (pkg?.terms_html)
      tabs.push({ id: 'terms', label: 'Terms & Conditions' });
    return tabs;
  };

  const tabs = getTabs();

  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(t => t.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [pkg, tabs, activeTab]);

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

  const toggleItineraryItem = (index: number) => {
    setExpandedItineraryItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Embla carousel navigation
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!emblaApi || !isMobile) return;

    const updateScrollButtons = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    updateScrollButtons();
    emblaApi.on('select', updateScrollButtons);
    emblaApi.on('reInit', updateScrollButtons);
    emblaApi.on('settle', updateScrollButtons);

    // Reinitialize on resize
    const handleResize = () => {
      emblaApi.reInit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      emblaApi.off('select', updateScrollButtons);
      emblaApi.off('reInit', updateScrollButtons);
      emblaApi.off('settle', updateScrollButtons);
      window.removeEventListener('resize', handleResize);
    };
  }, [emblaApi, isMobile]);

  // Click outside handlers for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setShowDatePicker(false);
      }
      if (
        dateDropdownRef.current &&
        !dateDropdownRef.current.contains(event.target as Node)
      ) {
        setShowDateDropdown(false);
      }
      if (
        personsDropdownRef.current &&
        !personsDropdownRef.current.contains(event.target as Node)
      ) {
        setShowPersonsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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

  return (
    <div className='package-details-page'>
      {/* Hero Image */}
      <div className='package-details-hero'>
        {pkg.thumbnail_image && pkg.thumbnail_image.trim() ? (
          <img
            src={pkg.thumbnail_image}
            alt={pkg.package_name}
            className='package-hero-image'
            onError={e => {
              e.currentTarget.style.display = 'none';
              const placeholder = e.currentTarget
                .nextElementSibling as HTMLElement;
              if (placeholder) {
                placeholder.style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div
          className='package-hero-placeholder'
          style={{
            display:
              pkg.thumbnail_image && pkg.thumbnail_image.trim()
                ? 'none'
                : 'flex',
          }}
        >
          <MapPin className='package-hero-icon' />
        </div>
      </div>

      {/* Title and Rating */}
      <div className='package-details-title-section'>
        <h1>{pkg.package_name}</h1>
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

      {/* Mobile Add to Cart Button - Center */}
      {isMobile && (
        <div className='mobile-add-to-cart-button-container'>
          <button
            onClick={handleMobileAddToCartClick}
            className='mobile-add-to-cart-button'
          >
            Add to Cart
          </button>
        </div>
      )}

      {/* Main Content with Tabs */}
      <div className='package-details-container'>
        {/* Vertical Tabs Panel - Left */}
        {isMobile ? (
          <div className='package-details-tabs-panel-mobile'>
            <button
              className='tabs-slider-nav-button tabs-slider-prev'
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              aria-label='Previous tabs'
            >
              <ChevronLeft size={20} />
            </button>
            <div className='tabs-slider-container' ref={emblaRef}>
              <div className='tabs-slider-wrapper'>
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    className={`package-tab-button ${
                      activeTab === tab.id ? 'active' : ''
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <button
              className='tabs-slider-nav-button tabs-slider-next'
              onClick={scrollNext}
              disabled={!canScrollNext}
              aria-label='Next tabs'
            >
              <ChevronRight size={20} />
            </button>
          </div>
        ) : (
          <div className='package-details-tabs-panel'>
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`package-tab-button ${
                  activeTab === tab.id ? 'active' : ''
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span>{tab.label}</span>
                <ChevronRight className='package-tab-chevron' />
              </button>
            ))}
          </div>
        )}

        {/* Content Panel - Right */}
        <div className='package-details-content-panel'>
          {activeTab === 'overview' && pkg.overview && (
            <div className='package-section'>
              <h2>Overview</h2>
              <p>{pkg.overview}</p>
            </div>
          )}

          {activeTab === 'description' && pkg.package_description && (
            <div className='package-section'>
              <h2>Description</h2>
              <p>{pkg.package_description}</p>
            </div>
          )}

          {activeTab === 'holiday' && pkg.holiday_description_html && (
            <div className='package-section'>
              <h2>Holiday Description</h2>
              <div
                className='package-html-content'
                dangerouslySetInnerHTML={{
                  __html: pkg.holiday_description_html,
                }}
              />
            </div>
          )}

          {activeTab === 'itinerary' &&
            pkg.itinerary &&
            pkg.itinerary.length > 0 && (
              <div className='package-section'>
                <h2>Itinerary</h2>
                <div className='itinerary-list'>
                  {pkg.itinerary.map((item, idx) => {
                    const isExpanded = expandedItineraryItems.has(idx);
                    return (
                      <div key={idx} className='itinerary-item'>
                        {item.heading && (
                          <button
                            className='itinerary-item-header'
                            onClick={() => toggleItineraryItem(idx)}
                          >
                            <h3
                              className='itinerary-heading'
                              dangerouslySetInnerHTML={{ __html: item.heading }}
                            />
                            <ChevronDown
                              className={`itinerary-chevron ${
                                isExpanded ? 'expanded' : ''
                              }`}
                            />
                          </button>
                        )}
                        {item.desc && (
                          <div
                            className={`itinerary-description ${
                              isExpanded ? 'expanded' : ''
                            }`}
                            dangerouslySetInnerHTML={{ __html: item.desc }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {activeTab === 'inclusions' && pkg.inclusion_html && (
            <div className='package-section'>
              <h2>Inclusions</h2>
              <div
                className='package-html-content'
                dangerouslySetInnerHTML={{ __html: pkg.inclusion_html }}
              />
            </div>
          )}

          {activeTab === 'exclusions' && pkg.exclusion_html && (
            <div className='package-section'>
              <h2>Exclusions</h2>
              <div
                className='package-html-content'
                dangerouslySetInnerHTML={{ __html: pkg.exclusion_html }}
              />
            </div>
          )}

          {activeTab === 'terms' && pkg.terms_html && (
            <div className='package-section'>
              <h2>Terms & Conditions</h2>
              <div
                className='package-html-content'
                dangerouslySetInnerHTML={{ __html: pkg.terms_html }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobile && (
        <>
          {showMobileDrawer && (
            <div
              className='mobile-drawer-overlay'
              onClick={() => setShowMobileDrawer(false)}
            />
          )}
          <div
            className={`mobile-booking-drawer ${
              showMobileDrawer ? 'mobile-drawer-open' : ''
            }`}
          >
            <div className='mobile-drawer-header'>
              <h3>Booking Details</h3>
              <button
                className='mobile-drawer-close'
                onClick={() => setShowMobileDrawer(false)}
              >
                <X className='close-icon' />
              </button>
            </div>
            <div className='mobile-drawer-content'>
              {pkg.solo_traveller_enabled && (
                <div className='solo-traveller-block'>
                  <label className='solo-checkbox'>
                    <input
                      type='checkbox'
                      checked={isSoloTraveller}
                      onChange={e => {
                        const checked = e.target.checked;
                        setIsSoloTraveller(checked);
                        setSoloTravellerShareConsent(false);
                        setSoloTravellerGender(null);
                        if (checked) {
                          setPersons({ adult: 1, child: 0, infant: 0 });
                          setShowPersonsDropdown(false);
                        } else {
                          setPersons({
                            adult: slug === 'offer-packages' ? 2 : 1,
                            child: 0,
                            infant: 0,
                          });
                        }
                      }}
                    />
                    Solo Traveller (AED{' '}
                    {formatPrice(pkg.solo_traveller_price || pkg.package_price)
                      .replace('AED ', '')
                      .trim()}
                    )
                  </label>

                  {isSoloTraveller && (
                    <div className='solo-options'>
                      <div className='solo-gender-pills'>
                        <button
                          className={`solo-pill ${
                            soloTravellerGender === 'male' ? 'active' : ''
                          }`}
                          onClick={() => setSoloTravellerGender('male')}
                        >
                          Male
                        </button>
                        <button
                          className={`solo-pill ${
                            soloTravellerGender === 'female' ? 'active' : ''
                          }`}
                          onClick={() => setSoloTravellerGender('female')}
                        >
                          Female
                        </button>
                      </div>
                      <label className='solo-consent'>
                        <input
                          type='checkbox'
                          checked={soloTravellerShareConsent}
                          onChange={e =>
                            setSoloTravellerShareConsent(e.target.checked)
                          }
                        />
                        {`I am comfortable to share the room with ${
                          soloTravellerGender === 'female' ? 'female' : 'male'
                        } passengers`}
                      </label>
                    </div>
                  )}
                </div>
              )}

              <div className='mobile-booking-price-section'>
                {isDiscountActive && getOriginalPrice() !== calculatedPrice && (
                  <span className='mobile-booking-price-original'>
                    {formatPrice(getOriginalPrice())}
                  </span>
                )}
                <span className={`mobile-booking-price-amount ${isDiscountActive ? 'discounted' : ''}`}>
                  {formatPrice(
                    calculatedPrice !== null
                      ? calculatedPrice
                      : pkg.package_price
                  )}
                </span>
                <span className='mobile-booking-price-label'>
                  {persons.adult > 0 || persons.child > 0 || persons.infant > 0
                    ? 'total'
                    : 'total'}
                </span>
              </div>

              <div className='mobile-input-selectors'>
                {/* Persons Selector */}
                <div
                  className='mobile-booking-input-wrapper'
                  ref={personsDropdownRef}
                >
                  <Users className='mobile-booking-input-icon' />
                  <input
                    type='text'
                    placeholder='Persons'
                    className='mobile-booking-input'
                    value={getPersonsDisplayText()}
                    readOnly
                    onClick={() => setShowPersonsDropdown(!showPersonsDropdown)}
                  />
                  <ChevronDown className='mobile-booking-dropdown-chevron' />
                  {showPersonsDropdown && (
                    <div className='mobile-booking-persons-dropdown'>
                      <div className='mobile-person-counter-row'>
                        <span className='mobile-person-label'>
                          Adult{' '}
                          <span className='person-age-info'>(8+ years)</span>
                        </span>
                        <div className='mobile-person-counter'>
                          <button
                            className='mobile-counter-button'
                            onClick={() => updatePersonCount('adult', -1)}
                            disabled={
                              slug === 'offer-packages'
                                ? persons.adult <= 2
                                : persons.adult <= 1
                            }
                          >
                            <Minus className='mobile-counter-icon' />
                          </button>
                          <span className='mobile-counter-value'>
                            {persons.adult}
                          </span>
                          <button
                            className='mobile-counter-button'
                            onClick={() => updatePersonCount('adult', 1)}
                          >
                            <Plus className='mobile-counter-icon' />
                          </button>
                        </div>
                      </div>
                      <div className='mobile-person-counter-row'>
                        <span className='mobile-person-label'>
                          Child{' '}
                          <span className='person-age-info'>(3-8 years)</span>
                        </span>
                        <div className='mobile-person-counter'>
                          <button
                            className='mobile-counter-button'
                            onClick={() => updatePersonCount('child', -1)}
                            disabled={persons.child === 0}
                          >
                            <Minus className='mobile-counter-icon' />
                          </button>
                          <span className='mobile-counter-value'>
                            {persons.child}
                          </span>
                          <button
                            className='mobile-counter-button'
                            onClick={() => updatePersonCount('child', 1)}
                          >
                            <Plus className='mobile-counter-icon' />
                          </button>
                        </div>
                      </div>
                      <div className='mobile-person-counter-row'>
                        <span className='mobile-person-label'>
                          Infant{' '}
                          <span className='person-age-info'>(0-2 years)</span>
                        </span>
                        <div className='mobile-person-counter'>
                          <button
                            className='mobile-counter-button'
                            onClick={() => updatePersonCount('infant', -1)}
                            disabled={persons.infant === 0}
                          >
                            <Minus className='mobile-counter-icon' />
                          </button>
                          <span className='mobile-counter-value'>
                            {persons.infant}
                          </span>
                          <button
                            className='mobile-counter-button'
                            onClick={() => updatePersonCount('infant', 1)}
                          >
                            <Plus className='mobile-counter-icon' />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Date Picker / Calendar */}
                {isPackageType() ? (
                  // Package: Show dropdown with dates
                  <div
                    className='mobile-booking-input-wrapper'
                    ref={dateDropdownRef}
                  >
                    <Calendar className='mobile-booking-input-icon' />
                    <input
                      type='text'
                      placeholder={
                        getAvailableDates().length === 0
                          ? 'No dates available'
                          : 'Select date'
                      }
                      className='mobile-booking-input'
                      value={
                        selectedDateString
                          ? (() => {
                              const d = parseDateStringToLocal(
                                selectedDateString
                              );
                              return d ? format(d, 'MMM dd, yyyy') : '';
                            })()
                          : ''
                      }
                      readOnly
                      disabled={getAvailableDates().length === 0}
                      onClick={() => {
                        if (getAvailableDates().length > 0) {
                          setShowDateDropdown(!showDateDropdown);
                        }
                      }}
                    />
                    <ChevronDown className='mobile-booking-dropdown-chevron' />
                    {showDateDropdown && getAvailableDates().length > 0 && (
                      <div className='mobile-booking-dates-dropdown'>
                        {getAvailableDates().map((dateStr, idx) => (
                          <div
                            key={idx}
                            className='mobile-booking-date-item'
                            onClick={e => {
                              e.stopPropagation();
                              handleDateStringSelect(dateStr);
                            }}
                          >
                            {(() => {
                              const d = parseDateStringToLocal(dateStr);
                              return d ? format(d, 'MMM dd, yyyy') : dateStr;
                            })()}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Tour: Show calendar
                  <div
                    className='mobile-booking-input-wrapper'
                    ref={datePickerRef}
                  >
                    <Calendar className='mobile-booking-input-icon' />
                    <input
                      type='text'
                      placeholder='Add dates'
                      className='mobile-booking-input'
                      value={
                        selectedDate ? format(selectedDate, 'MMM dd, yyyy') : ''
                      }
                      readOnly
                      onClick={() => setShowDatePicker(!showDatePicker)}
                    />
                    {showDatePicker && (
                      <div className='mobile-booking-calendar-dropdown'>
                        {slug === 'flexible-date-packages' ? (
                          <FlexibleDateCalendar
                            packageId={pkg?.package_id || ''}
                            endDate={pkg?.end_date}
                            selectedDate={selectedDate}
                            onDateSelect={handleDateSelect}
                            month={month}
                            onMonthChange={setMonth}
                          />
                        ) : (
                          <>
                            <div className='mobile-calendar-header-nav'>
                              <button
                                className='mobile-calendar-nav-button'
                                onClick={e => {
                                  e.stopPropagation();
                                  const newMonth = new Date(month);
                                  newMonth.setMonth(newMonth.getMonth() - 1);
                                  setMonth(newMonth);
                                }}
                              >
                                ‹
                              </button>
                              <button
                                className='mobile-calendar-nav-button'
                                onClick={e => {
                                  e.stopPropagation();
                                  const newMonth = new Date(month);
                                  newMonth.setMonth(newMonth.getMonth() + 1);
                                  setMonth(newMonth);
                                }}
                              >
                                ›
                              </button>
                            </div>
                            <DayPicker
                              mode='single'
                              selected={selectedDate}
                              onSelect={handleDateSelect}
                              disabled={getDisabledDates}
                              numberOfMonths={1}
                              showOutsideDays={true}
                              month={month}
                              onMonthChange={setMonth}
                              className='mobile-custom-calendar'
                              modifiersClassNames={{
                                disabled: 'rdp-day_unavailable',
                              }}
                            />
                            <div className='mobile-calendar-footer'>
                              <button
                                className='mobile-clear-dates-button'
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedDate(undefined);
                                }}
                              >
                                Clear dates
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className='mobile-booking-actions'>
                <button
                  onClick={handleAddToCart}
                  className='mobile-booking-add-to-cart-button'
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Desktop Add to Cart Button - Fixed Center Bottom */}
      {!isMobile && (
        <Popover open={showDesktopPopover} onOpenChange={setShowDesktopPopover}>
          <PopoverTrigger asChild>
            <button className='desktop-add-to-cart-button-fixed'>
              Add to Cart
            </button>
          </PopoverTrigger>
          <PopoverContent
            className='desktop-booking-popover'
            side='top'
            align='center'
            sideOffset={16}
          >
            <div className='desktop-booking-popover-header'>
              <h3 className='desktop-booking-popover-title'>Booking Details</h3>
              <button
                className='desktop-booking-popover-close'
                onClick={() => setShowDesktopPopover(false)}
                aria-label='Close booking popover'
              >
                <X className='desktop-booking-popover-close-icon' />
              </button>
            </div>
              <div className='desktop-booking-popover-content'>
                {pkg.solo_traveller_enabled && (
                  <div className='solo-traveller-block'>
                    <label className='solo-checkbox'>
                      <input
                        type='checkbox'
                        checked={isSoloTraveller}
                        onChange={e => {
                          const checked = e.target.checked;
                          setIsSoloTraveller(checked);
                          setSoloTravellerShareConsent(false);
                          setSoloTravellerGender(null);
                          if (checked) {
                            setPersons({ adult: 1, child: 0, infant: 0 });
                            setShowPersonsDropdown(false);
                          } else {
                            setPersons({
                              adult: slug === 'offer-packages' ? 2 : 1,
                              child: 0,
                              infant: 0,
                            });
                          }
                        }}
                      />
                      Solo Traveller (AED{' '}
                      {formatPrice(pkg.solo_traveller_price || pkg.package_price)
                        .replace('AED ', '')
                        .trim()}
                      )
                    </label>

                    {isSoloTraveller && (
                      <div className='solo-options'>
                        <div className='solo-gender-pills'>
                          <button
                            className={`solo-pill ${
                              soloTravellerGender === 'male' ? 'active' : ''
                            }`}
                            onClick={() => setSoloTravellerGender('male')}
                          >
                            Male
                          </button>
                          <button
                            className={`solo-pill ${
                              soloTravellerGender === 'female' ? 'active' : ''
                            }`}
                            onClick={() => setSoloTravellerGender('female')}
                          >
                            Female
                          </button>
                        </div>
                        <label className='solo-consent'>
                          <input
                            type='checkbox'
                            checked={soloTravellerShareConsent}
                            onChange={e =>
                              setSoloTravellerShareConsent(e.target.checked)
                            }
                          />
                          {`I am comfortable to share the room with ${
                            soloTravellerGender === 'female' ? 'female' : 'male'
                          } passengers`}
                        </label>
                      </div>
                    )}
                  </div>
                )}

                <div className='booking-price-section'>
                {isDiscountActive && getOriginalPrice() !== calculatedPrice && (
                  <span className='booking-price-original'>
                    {formatPrice(getOriginalPrice())}
                  </span>
                )}
                <span className={`booking-price-amount ${isDiscountActive ? 'discounted' : ''}`}>
                  {formatPrice(
                    calculatedPrice !== null
                      ? calculatedPrice
                      : pkg.package_price
                  )}
                </span>
                <span className='booking-price-label'>
                  {persons.adult > 0 || persons.child > 0 || persons.infant > 0
                    ? 'total'
                    : 'total'}
                </span>
              </div>

              <div className='input-selectors'>
                {/* Persons Selector */}
                <div className='booking-input-wrapper' ref={personsDropdownRef}>
                  <Users className='booking-input-icon' />
                  <input
                    type='text'
                    placeholder='Persons'
                    className='booking-input'
                    value={getPersonsDisplayText()}
                    readOnly
                    disabled={isSoloTraveller}
                    onClick={() =>
                      !isSoloTraveller &&
                      setShowPersonsDropdown(!showPersonsDropdown)
                    }
                  />
                  <ChevronDown className='booking-dropdown-chevron' />
                  {showPersonsDropdown && (
                    <div className='booking-persons-dropdown'>
                      <div className='person-counter-row'>
                        <span className='person-label'>
                          Adult{' '}
                          <span className='person-age-info'>(8+ years)</span>
                        </span>
                        <div className='person-counter'>
                          <button
                            className='counter-button'
                            onClick={() => updatePersonCount('adult', -1)}
                            disabled={
                              isSoloTraveller
                                ? true
                                : slug === 'offer-packages'
                                  ? persons.adult <= 2
                                  : persons.adult <= 1
                            }
                          >
                            <Minus className='counter-icon' />
                          </button>
                          <span className='counter-value'>{persons.adult}</span>
                          <button
                            className='counter-button'
                            onClick={() => updatePersonCount('adult', 1)}
                            disabled={isSoloTraveller}
                          >
                            <Plus className='counter-icon' />
                          </button>
                        </div>
                      </div>
                      <div className='person-counter-row'>
                        <span className='person-label'>
                          Child{' '}
                          <span className='person-age-info'>(3-8 years)</span>
                        </span>
                        <div className='person-counter'>
                          <button
                            className='counter-button'
                            onClick={() => updatePersonCount('child', -1)}
                            disabled={isSoloTraveller || persons.child === 0}
                          >
                            <Minus className='counter-icon' />
                          </button>
                          <span className='counter-value'>{persons.child}</span>
                          <button
                            className='counter-button'
                            onClick={() => updatePersonCount('child', 1)}
                            disabled={isSoloTraveller}
                          >
                            <Plus className='counter-icon' />
                          </button>
                        </div>
                      </div>
                      <div className='person-counter-row'>
                        <span className='person-label'>
                          Infant{' '}
                          <span className='person-age-info'>(0-2 years)</span>
                        </span>
                        <div className='person-counter'>
                          <button
                            className='counter-button'
                            onClick={() => updatePersonCount('infant', -1)}
                            disabled={isSoloTraveller || persons.infant === 0}
                          >
                            <Minus className='counter-icon' />
                          </button>
                          <span className='counter-value'>
                            {persons.infant}
                          </span>
                          <button
                            className='counter-button'
                            onClick={() => updatePersonCount('infant', 1)}
                            disabled={isSoloTraveller}
                          >
                            <Plus className='counter-icon' />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Date Picker / Calendar */}
                {isPackageType() ? (
                  // Package: Show dropdown with dates
                  <div className='booking-input-wrapper' ref={dateDropdownRef}>
                    <Calendar className='booking-input-icon' />
                    <input
                      type='text'
                      placeholder={
                        getAvailableDates().length === 0
                          ? 'No dates available'
                          : 'Select date'
                      }
                      className='booking-input'
                      value={
                        selectedDateString
                          ? (() => {
                              const d = parseDateStringToLocal(
                                selectedDateString
                              );
                              return d ? format(d, 'MMM dd, yyyy') : '';
                            })()
                          : ''
                      }
                      readOnly
                      disabled={getAvailableDates().length === 0}
                      onClick={() => {
                        if (getAvailableDates().length > 0) {
                          setShowDateDropdown(!showDateDropdown);
                        }
                      }}
                    />
                    <ChevronDown className='booking-dropdown-chevron' />
                    {showDateDropdown && getAvailableDates().length > 0 && (
                      <div className='booking-dates-dropdown'>
                        {getAvailableDates().map((dateStr, idx) => (
                          <div
                            key={idx}
                            className='booking-date-item'
                            onClick={e => {
                              e.stopPropagation();
                              handleDateStringSelect(dateStr);
                            }}
                          >
                            {(() => {
                              const d = parseDateStringToLocal(dateStr);
                              return d ? format(d, 'MMM dd, yyyy') : dateStr;
                            })()}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Tour: Show calendar
                  <div className='booking-input-wrapper' ref={datePickerRef}>
                    <Calendar className='booking-input-icon' />
                    <input
                      type='text'
                      placeholder='Add dates'
                      className='booking-input'
                      value={
                        selectedDate ? format(selectedDate, 'MMM dd, yyyy') : ''
                      }
                      readOnly
                      onClick={() => setShowDatePicker(!showDatePicker)}
                    />
                    {showDatePicker && (
                      <div className='booking-calendar-dropdown'>
                        {slug === 'flexible-date-packages' ? (
                          <FlexibleDateCalendar
                            packageId={pkg?.package_id || ''}
                            endDate={pkg?.end_date}
                            selectedDate={selectedDate}
                            onDateSelect={handleDateSelect}
                            month={month}
                            onMonthChange={setMonth}
                          />
                        ) : (
                          <>
                            <div className='calendar-header-nav'>
                              <button
                                className='calendar-nav-button'
                                onClick={e => {
                                  e.stopPropagation();
                                  const newMonth = new Date(month);
                                  newMonth.setMonth(newMonth.getMonth() - 1);
                                  setMonth(newMonth);
                                }}
                              >
                                ‹
                              </button>
                              <button
                                className='calendar-nav-button'
                                onClick={e => {
                                  e.stopPropagation();
                                  const newMonth = new Date(month);
                                  newMonth.setMonth(newMonth.getMonth() + 1);
                                  setMonth(newMonth);
                                }}
                              >
                                ›
                              </button>
                            </div>
                            <DayPicker
                              mode='single'
                              selected={selectedDate}
                              onSelect={handleDateSelect}
                              disabled={getDisabledDates}
                              numberOfMonths={1}
                              showOutsideDays={true}
                              month={month}
                              onMonthChange={setMonth}
                              className='custom-calendar'
                              modifiersClassNames={{
                                disabled: 'rdp-day_unavailable',
                              }}
                            />
                            <div className='calendar-footer'>
                              <button
                                className='clear-dates-button'
                                onClick={e => {
                                  e.stopPropagation();
                                  setSelectedDate(undefined);
                                }}
                              >
                                Clear dates
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className='booking-actions'>
                <button
                  onClick={handleAddToCart}
                  className='booking-add-to-cart-button'
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}

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
