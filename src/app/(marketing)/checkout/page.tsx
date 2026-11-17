'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useBooking } from '@/context/BookingContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronDown,
  FileText,
  Globe,
  ImagePlus,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import Select from '@/components/site/ui/Select';
import DateField from '@/components/site/ui/DateField';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  detectUserLocation,
  initializeExchangeRate,
  type UserLocation,
} from '@/lib/location-utils';
import { parseDateStringToLocal } from '@/lib/utils';
import { useAddonNames, useAgentStatus } from '@/hooks/use-marketing-queries';
import { AgentDiscountBadge } from '@/components/marketing/AgentDiscountPrice/AgentDiscountPrice';
import ExHeader from '../Home/ex/ExHeader';
import { EX_FONTS } from '../Home/ex/fonts';
import '../Home/ex/ex.css';
import './checkout.css';

interface PassengerData {
  salutation: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp: string;
  country: string;
  pickupLocation: string;
  permanentAddress: string;
  passportExpiry: string;
  nationality?: string; // For additional passengers
  // Documents
  applicantPhoto: File | null;
  passportMainCopy: File | null;
  passportLastPage: File | null;
  passportCover: File | null;
  nationalIdCard: File | null;
  birthCertificate: File | null; // For children only
}

interface InfantDocuments {
  applicantPhoto: File | null;
  passportMainCopy: File | null;
  passportLastPage: File | null;
  passportCover: File | null;
  birthCertificate: File | null;
  // Pancard not collected for infants
}

type TourPickupInfo = {
  packageId: string;
  packageName: string;
  pickupLocation: string;
};

function CheckoutPageContent() {
  const router = useRouter();
  const {
    booking,
    isValidating,
    bookingError,
    isLoaded: isBookingLoaded,
  } = useBooking();
  // One package per booking. The rules below stay written over a list so
  // every per-item check (tours, offers, visa, documents) reads as before.
  const bookingItems = useMemo(() => (booking ? [booking] : []), [booking]);
  // Only a server-validated price counts
  const getTotalPrice = () => (booking?.validated ? booking.price : 0);
  const isPriced = !!booking?.validated && !isValidating && !bookingError;

  // "Book now" arrives from part-way down the package page; start at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [paymentType, setPaymentType] = useState<'half' | 'full'>('full');
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [platformFeePercentage, setPlatformFeePercentage] = useState<number>(0);
  const [closedSections, setClosedSections] = useState<Record<string, boolean>>(
    {}
  );
  const { addonNames } = useAddonNames();

  // Subscribed agents must pay in full. `isAgentStatusResolved` gates the
  // payment-type UI so the half option never flashes before we know.
  const { data: agentData, isPending: isAgentStatusPending } = useAgentStatus();
  const isSubscribedAgent = !!agentData?.hasActiveSubscription;
  const isAgentStatusResolved = !isAgentStatusPending;

  // Check if the booking is a tour (not a package)
  // Tours typically have "tour" in the category slug/name
  const isFullPaymentOnlySlug = (slug: string) => {
    const s = slug.toLowerCase();
    return s.includes('tour') || s === 'marina-cruise-dinner';
  };

  const isTourCheckout = bookingItems.some(item =>
    isFullPaymentOnlySlug(item.categorySlug || '')
  );

  // Per-package rule from packages.accept_payment (server-validated).
  // A package marked accept_payment=.full. makes the booking full-payment.
  const hasFullPaymentOnlyPackage = bookingItems.some(
    item => item.acceptPayment === 'full'
  );

  // Single source of truth for "no half-payment option here".
  // Any one of: tour/marina category, a package marked accept_payment='full',
  // or a subscribed agent.
  const requiresFullPayment =
    isTourCheckout || hasFullPaymentOnlyPackage || isSubscribedAgent;

  // Pickup location only for real UAE tours, not marina cruise
  const showTourPickup = bookingItems.some(item =>
    (item.categorySlug || '').toLowerCase().includes('tour')
  );

  // Check if the booking has only tours (no packages)
  const hasOnlyTours =
    bookingItems.length > 0 &&
    bookingItems.every(item => isFullPaymentOnlySlug(item.categorySlug || ''));

  // Check if the booking has packages (not tours)
  const hasPackages = bookingItems.some(
    item => !isFullPaymentOnlySlug(item.categorySlug || '')
  );

  // Show passport expiry only for packages
  // Hide passport expiry for tours
  const shouldShowPassportExpiry = hasPackages;

  // Check if the booking is a flexible date package
  const hasFlexibleDatePackage = bookingItems.some(item => {
    const categorySlug = item.categorySlug?.toLowerCase() || '';
    return categorySlug === 'flexible-date-packages';
  });

  // Check if the booking is an offer package
  const hasOfferPackage = bookingItems.some(item => {
    const categorySlug = item.categorySlug?.toLowerCase() || '';
    return categorySlug === 'offer-packages';
  });

  // Check if the booking has visa selected
  const hasVisaSelected = bookingItems.some(item => item.withVisa === true);

  const tourItems = useMemo(
    () =>
      bookingItems.filter(item => {
        const categorySlug = item.categorySlug?.toLowerCase() || '';
        return categorySlug.includes('tour');
      }),
    [bookingItems]
  );

  const tourItemIds = useMemo(
    () => tourItems.map(item => item.packageId).join(','),
    [tourItems]
  );

  const [tourPickupLocations, setTourPickupLocations] = useState<
    TourPickupInfo[]
  >([]);
  const [loadingTourPickups, setLoadingTourPickups] = useState(false);

  // Force full payment whenever any rule demands it (tour/marina category,
  // a package with accept_payment='full', or a subscribed agent).
  useEffect(() => {
    if (requiresFullPayment) {
      setPaymentType('full');
    }
  }, [requiresFullPayment]);

  // Load tour pickup locations from package data (read-only at checkout)
  useEffect(() => {
    if (!isTourCheckout || tourItems.length === 0) {
      setTourPickupLocations([]);
      return;
    }

    let cancelled = false;

    async function fetchTourPickups() {
      setLoadingTourPickups(true);
      try {
        const results = await Promise.all(
          tourItems.map(async item => {
            try {
              const res = await fetch(
                `/api/packages/${encodeURIComponent(item.packageId)}`
              );
              const json = await res.json().catch(() => ({}));
              const pickup =
                res.ok && json.data?.pickup_location
                  ? String(json.data.pickup_location).trim()
                  : '';
              return {
                packageId: item.packageId,
                packageName: item.packageName,
                pickupLocation: pickup,
              };
            } catch {
              return {
                packageId: item.packageId,
                packageName: item.packageName,
                pickupLocation: '',
              };
            }
          })
        );

        if (cancelled) return;

        setTourPickupLocations(results);

        const combinedPickup = results
          .filter(r => r.pickupLocation)
          .map(r =>
            tourItems.length > 1
              ? `${r.packageName}: ${r.pickupLocation}`
              : r.pickupLocation
          )
          .join(' | ');

        setPassengers(prev => {
          if (prev.length === 0) return prev;
          if (prev[0].pickupLocation === combinedPickup) return prev;
          return [
            { ...prev[0], pickupLocation: combinedPickup },
            ...prev.slice(1),
          ];
        });
      } finally {
        if (!cancelled) setLoadingTourPickups(false);
      }
    }

    fetchTourPickups();

    return () => {
      cancelled = true;
    };
  }, [isTourCheckout, tourItemIds, tourItems]);

  // Calculate total passengers
  const totalAdults = bookingItems.reduce(
    (sum, item) => sum + (item.isSoloTraveller ? 1 : item.adults),
    0
  );
  const totalChildren = bookingItems.reduce(
    (sum, item) => sum + (item.isSoloTraveller ? 0 : item.children),
    0
  );
  const totalInfants = bookingItems.reduce(
    (sum, item) => sum + (item.infants || 0),
    0
  );
  const totalPassengers = totalAdults + totalChildren;

  // Initialize passengers array
  const [passengers, setPassengers] = useState<PassengerData[]>(() => {
    const initial: PassengerData[] = [];
    for (let i = 0; i < totalPassengers; i++) {
      initial.push({
        salutation: 'Mr',
        firstName: '',
        lastName: '',
        email: i === 0 ? '' : '', // Only first passenger needs email
        phone: i === 0 ? '' : '', // Only first passenger needs phone
        whatsapp: i === 0 ? '' : '', // Only first passenger needs whatsapp
        country: i === 0 ? '' : '', // Only first passenger needs country
        pickupLocation: i === 0 ? '' : '', // Only first passenger needs pickup
        permanentAddress: i === 0 ? '' : '', // Only first passenger needs address
        passportExpiry: '',
        nationality: i === 0 ? undefined : '',
        applicantPhoto: null,
        passportMainCopy: null,
        passportLastPage: null,
        passportCover: null,
        nationalIdCard: null,
        birthCertificate: null,
      });
    }
    return initial;
  });

  // Infant documents - one full doc set per infant (all docs like lead + birth certificate)
  const [infantDocuments, setInfantDocuments] = useState<InfantDocuments[]>(
    () =>
      Array.from({ length: totalInfants }, () => ({
        applicantPhoto: null,
        passportMainCopy: null,
        passportLastPage: null,
        passportCover: null,
        birthCertificate: null,
      }))
  );

  // Sync infantDocuments when totalInfants changes
  useEffect(() => {
    const inf = bookingItems.reduce((s, i) => s + (i.infants || 0), 0);
    setInfantDocuments(prev => {
      if (prev.length === inf) return prev;
      return Array.from(
        { length: Math.max(inf, 0) },
        (_, i) =>
          prev[i] || {
            applicantPhoto: null,
            passportMainCopy: null,
            passportLastPage: null,
            passportCover: null,
            birthCertificate: null,
          }
      );
    });
  }, [bookingItems]);

  // Update passengers when the booking changes
  useEffect(() => {
    const newTotal = bookingItems.reduce(
      (sum, item) => sum + item.adults + item.children,
      0
    );
    // Compare with the forms we have, not this render's total: after a
    // reload the booking arrives after the first render.
    if (newTotal !== passengers.length) {
      const newPassengers: PassengerData[] = [];
      for (let i = 0; i < newTotal; i++) {
        newPassengers.push({
          salutation: passengers[i]?.salutation || 'Mr',
          firstName: passengers[i]?.firstName || '',
          lastName: passengers[i]?.lastName || '',
          email: i === 0 ? passengers[i]?.email || '' : '',
          phone: i === 0 ? passengers[i]?.phone || '' : '',
          whatsapp: i === 0 ? passengers[i]?.whatsapp || '' : '',
          country: i === 0 ? passengers[i]?.country || '' : '',
          pickupLocation: i === 0 ? passengers[i]?.pickupLocation || '' : '',
          permanentAddress:
            i === 0 ? passengers[i]?.permanentAddress || '' : '',
          passportExpiry: passengers[i]?.passportExpiry || '',
          nationality: i === 0 ? undefined : passengers[i]?.nationality || '',
          applicantPhoto: passengers[i]?.applicantPhoto || null,
          passportMainCopy: passengers[i]?.passportMainCopy || null,
          passportLastPage: passengers[i]?.passportLastPage || null,
          passportCover: passengers[i]?.passportCover || null,
          nationalIdCard: passengers[i]?.nationalIdCard || null,
          birthCertificate: passengers[i]?.birthCertificate || null,
        });
      }
      setPassengers(newPassengers);
    }
  }, [bookingItems]);

  // Nothing being booked: back to the holidays list (unless we have an error
  // param from payment callback – e.g. Oman visa users). Waits for the stored
  // booking to load, so a refresh on /checkout keeps the booking.
  const searchParams = useSearchParams();
  const hasPaymentError = !!searchParams?.get('error');
  const paymentErrorCode = searchParams?.get('error') || null;
  useEffect(() => {
    if (isBookingLoaded && bookingItems.length === 0 && !hasPaymentError) {
      router.replace('/holidays');
    }
  }, [isBookingLoaded, bookingItems, router, hasPaymentError]);

  // Document display logic:
  // - For tours: never show documents
  // - For offer packages or flexible date packages: only show if visa is selected
  // - For other packages: show documents for India (preserve previous functionality)
  // Computed after passengers state is initialized
  const shouldShowDocuments = useMemo(() => {
    // Tours: never show documents
    if (isTourCheckout) {
      return false;
    }

    // Offer packages or flexible date packages: only show if visa is selected
    if (hasOfferPackage || hasFlexibleDatePackage) {
      return hasVisaSelected;
    }

    // Other packages: show for India
    return passengers[0]?.country === 'India';
  }, [
    isTourCheckout,
    hasOfferPackage,
    hasFlexibleDatePackage,
    hasVisaSelected,
    passengers,
  ]);

  // Fetch platform fee and detect user location on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoadingLocation(true);
        // Initialize exchange rate first (fetch from database)
        await initializeExchangeRate();
        // Fetch platform fee
        try {
          const feeResponse = await fetch('/api/platform-fee');
          const feeResult = await feeResponse.json();
          if (feeResult.data) {
            setPlatformFeePercentage(feeResult.data.fee_percentage || 0);
          }
        } catch (error) {
          console.error('Error fetching platform fee:', error);
          setPlatformFeePercentage(0);
        }

        // Detect location with error handling for CORS issues
        try {
          const location = await detectUserLocation();
          setUserLocation(location);
        } catch (locationError) {
          // If location detection fails (CORS, network, etc.), use default
          console.warn(
            'Location detection failed, using default:',
            locationError
          );
          const defaultLocation = {
            country: 'Unknown',
            countryCode: 'US',
            isIndia: false,
            currency: 'AED',
            currencySymbol: 'AED',
          };
          setUserLocation(defaultLocation);
        }
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
      } finally {
        setIsLoadingLocation(false);
      }
    };

    initialize();
  }, []);

  // Helper function to format price - always shows AED
  const formatPrice = (price: number): string => {
    const rounded = Math.round(price * 100) / 100;
    const digits = Number.isInteger(rounded) ? 0 : 2;
    return `AED ${rounded.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })}`;
  };

  const updatePassenger = (
    index: number,
    field: keyof PassengerData,
    value: string | File | null
  ) => {
    setPassengers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    // Clear error for this field
    if (errors[`passenger_${index}_${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`passenger_${index}_${field}`];
        return newErrors;
      });
    }
  };

  const handleFileUpload = (
    index: number,
    field:
      | 'applicantPhoto'
      | 'passportMainCopy'
      | 'passportLastPage'
      | 'passportCover'
      | 'nationalIdCard'
      | 'birthCertificate',
    file: File | null
  ) => {
    updatePassenger(index, field, file);
  };

  const handleInfantDocumentUpload = (
    infantIndex: number,
    field: keyof InfantDocuments,
    file: File | null
  ) => {
    setInfantDocuments(prev => {
      const updated = [...prev];
      if (!updated[infantIndex])
        updated[infantIndex] = {
          applicantPhoto: null,
          passportMainCopy: null,
          passportLastPage: null,
          passportCover: null,
          birthCertificate: null,
        };
      updated[infantIndex] = { ...updated[infantIndex], [field]: file };
      return updated;
    });
    const key = `infant_${infantIndex}_${field}`;
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const leadPassenger = passengers[0];
    const isOtherCountry = leadPassenger?.country === 'Other';

    if (showTourPickup && loadingTourPickups) {
      newErrors.tourPickupLocation = 'Please wait while pickup details load.';
    }

    // When "Other" is selected, only validate the first passenger
    const passengersToValidate = isOtherCountry ? [passengers[0]] : passengers;

    passengersToValidate.forEach((passenger, index) => {
      // Get the actual index in the passengers array
      const actualIndex = isOtherCountry ? 0 : index;

      // Required fields for all passengers
      if (!passenger.salutation) {
        newErrors[`passenger_${actualIndex}_salutation`] =
          'Salutation is required';
      }
      if (!passenger.firstName.trim()) {
        newErrors[`passenger_${actualIndex}_firstName`] =
          'First name is required';
      }
      if (!passenger.lastName.trim()) {
        newErrors[`passenger_${actualIndex}_lastName`] =
          'Last name is required';
      }
      // Only validate passport expiry if it should be shown (packages, not tours)
      if (shouldShowPassportExpiry && !passenger.passportExpiry) {
        newErrors[`passenger_${actualIndex}_passportExpiry`] =
          'Passport expiry date is required';
      }

      // Required fields only for first passenger
      if (actualIndex === 0) {
        if (!passenger.email.trim()) {
          newErrors[`passenger_${actualIndex}_email`] = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passenger.email)) {
          newErrors[`passenger_${actualIndex}_email`] = 'Invalid email format';
        }
        if (!passenger.phone.trim()) {
          newErrors[`passenger_${actualIndex}_phone`] =
            'Phone number is required';
        }
        if (!passenger.whatsapp.trim()) {
          newErrors[`passenger_${actualIndex}_whatsapp`] =
            'WhatsApp number is required';
        }
        if (!passenger.country) {
          newErrors[`passenger_${actualIndex}_country`] = 'Country is required';
        }
        if (showTourPickup && !passenger.pickupLocation.trim()) {
          newErrors.tourPickupLocation =
            'Pickup location is not configured for one or more tours. Please contact support.';
        }
        if (!hasOnlyTours && !passenger.permanentAddress.trim()) {
          newErrors[`passenger_${actualIndex}_permanentAddress`] =
            'Permanent address is required';
        }
      } else {
        // Additional passengers need nationality only if not "Other" country
        if (!isOtherCountry && !passenger.nationality) {
          newErrors[`passenger_${actualIndex}_nationality`] =
            'Nationality is required';
        }
      }

      // Required documents logic:
      // - For tours: never require documents
      // - For offer packages or flexible date packages: only if visa is selected and not "Other" country
      // - For other packages: require if not "Other" country (preserve previous functionality)
      const requiresDocuments = isTourCheckout
        ? false // Tours: never require documents
        : hasOfferPackage || hasFlexibleDatePackage
          ? hasVisaSelected && !isOtherCountry // Offer/flexible: only if visa selected
          : !isOtherCountry; // Other packages: require if not "Other"

      if (requiresDocuments) {
        if (!passenger.applicantPhoto) {
          newErrors[`passenger_${actualIndex}_applicantPhoto`] =
            'Applicant photo is required';
        }
        if (!passenger.passportMainCopy) {
          newErrors[`passenger_${actualIndex}_passportMainCopy`] =
            'Passport main copy is required';
        }
        // Birth certificate required for children (index >= totalAdults)
        const isChild = actualIndex >= totalAdults;
        if (isChild && !passenger.birthCertificate) {
          newErrors[`passenger_${actualIndex}_birthCertificate`] =
            'Birth certificate is required for child';
        }
      }
    });

    // Infant documents validation (when documents required)
    const requiresDocuments = isTourCheckout
      ? false
      : hasOfferPackage || hasFlexibleDatePackage
        ? hasVisaSelected && !isOtherCountry
        : !isOtherCountry;
    if (requiresDocuments && totalInfants > 0) {
      for (let i = 0; i < totalInfants; i++) {
        const infant = infantDocuments[i];
        if (!infant) continue;
        if (!infant.applicantPhoto) {
          newErrors[`infant_${i}_applicantPhoto`] =
            `Infant ${i + 1}: Applicant photo is required`;
        }
        if (!infant.passportMainCopy) {
          newErrors[`infant_${i}_passportMainCopy`] =
            `Infant ${i + 1}: Passport main copy is required`;
        }
        if (!infant.birthCertificate) {
          newErrors[`infant_${i}_birthCertificate`] =
            `Infant ${i + 1}: Birth certificate is required`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handlePayment = async () => {
    if (!validateForm()) {
      toast.error('Please fill all required fields correctly');
      // Scroll to the first error, once the new errors have rendered
      requestAnimationFrame(() => {
        const element = document.querySelector(
          '.co .ui-field.has-error, .co .co-file.is-error'
        );
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }

    // Validate minimum adults and total passengers for all packages
    for (const item of bookingItems) {
      // A solo traveller booking is exactly one adult and no children/infants,
      // whatever the raw counts say. Mirrors how /api/booking/validate prices it.
      const effectiveAdults = item.isSoloTraveller ? 1 : item.adults;
      const effectiveChildren = item.isSoloTraveller ? 0 : item.children;
      const effectiveInfants = item.isSoloTraveller ? 0 : item.infants || 0;

      // Check total passengers (can't be 0)
      const totalPassengers =
        effectiveAdults + effectiveChildren + effectiveInfants;
      if (totalPassengers === 0) {
        toast.error(
          `Please select at least one passenger for "${item.packageName}". Please update your booking.`
        );
        return;
      }

      // All packages require at least 1 adult
      if (effectiveAdults === 0) {
        toast.error(
          `At least 1 adult is required for "${item.packageName}". Please update your booking.`
        );
        return;
      }

      // Offer packages require minimum 2 adults - but a solo traveller booking
      // is a deliberate 1-person booking, and the package page already checked
      // it against that package's own min_adults before allowing it.
      if (
        !item.isSoloTraveller &&
        item.categorySlug === 'offer-packages' &&
        effectiveAdults < 2
      ) {
        toast.error(
          `Offer packages require a minimum of 2 adults. Please update "${item.packageName}" in your booking.`
        );
        return;
      }
    }

    // Half payment is not allowed for this booking
    if (requiresFullPayment && paymentType === 'half') {
      toast.error(
        isSubscribedAgent
          ? 'Agent bookings require full payment.'
          : 'This booking requires full payment.'
      );
      setPaymentType('full');
      return;
    }

    if (!userLocation) {
      toast.error('Please wait while we detect your location...');
      return;
    }

    // Never charge a price the server hasn't confirmed
    if (!isPriced) {
      toast.error(
        bookingError || 'Please wait while we confirm the price of your booking.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // When "Other" is selected, only process the first passenger
      const firstPassenger = passengers[0];
      const isOtherCountry = firstPassenger?.country === 'Other';
      const passengersToProcess = isOtherCountry ? [passengers[0]] : passengers;

      // Convert all files to base64
      const passengersWithBase64 = await Promise.all(
        passengersToProcess.map(async passenger => ({
          ...passenger,
          applicantPhoto: passenger.applicantPhoto
            ? await fileToBase64(passenger.applicantPhoto)
            : null,
          passportMainCopy: passenger.passportMainCopy
            ? await fileToBase64(passenger.passportMainCopy)
            : null,
          passportLastPage: passenger.passportLastPage
            ? await fileToBase64(passenger.passportLastPage)
            : null,
          passportCover: passenger.passportCover
            ? await fileToBase64(passenger.passportCover)
            : null,
          nationalIdCard: passenger.nationalIdCard
            ? await fileToBase64(passenger.nationalIdCard)
            : null,
          birthCertificate: passenger.birthCertificate
            ? await fileToBase64(passenger.birthCertificate)
            : null,
        }))
      );

      // Convert infant documents to base64
      const infantDocumentsBase64 = await Promise.all(
        infantDocuments.map(async infant => ({
          applicantPhoto: infant.applicantPhoto
            ? await fileToBase64(infant.applicantPhoto)
            : null,
          passportMainCopy: infant.passportMainCopy
            ? await fileToBase64(infant.passportMainCopy)
            : null,
          passportLastPage: infant.passportLastPage
            ? await fileToBase64(infant.passportLastPage)
            : null,
          passportCover: infant.passportCover
            ? await fileToBase64(infant.passportCover)
            : null,
          birthCertificate: infant.birthCertificate
            ? await fileToBase64(infant.birthCertificate)
            : null,
        }))
      );

      const totalAmountAED = getTotalPrice();

      // Always use AED for all transactions
      let paymentAmount: number;
      let currency: string;

      // CCAvenue Dubai account (.ae domain) uses AED currency
      // Use AED for all transactions since the account is configured for AED
      const basePaymentAmount =
        paymentType === 'half' ? totalAmountAED / 2 : totalAmountAED;

      // Calculate platform fee
      const platformFee = (basePaymentAmount * platformFeePercentage) / 100;

      // Add platform fee to payment amount
      paymentAmount = basePaymentAmount + platformFee;
      currency = 'AED'; // Always use AED

      // Create booking first
      const bookingResponse = await fetch('/api/checkout/create-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // API field (stored as bookings.cart_items) - always one booking now
          cartItems: bookingItems.map(item => ({
            packageId: item.packageId,
            packageName: item.packageName,
            categorySlug: item.categorySlug,
            adults: item.adults,
            children: item.children,
            infants: item.infants || 0,
            selectedDate: item.selectedDate,
            isSoloTraveller: item.isSoloTraveller ?? false,
            soloTravellerGender: item.soloTravellerGender ?? null,
            soloTravellerShareConsent: item.soloTravellerShareConsent ?? false,
            // Add-ons (offer packages) - stored for booking reference, not pricing
            addonDeals:
              item.addonDeals && item.addonDeals.length > 0
                ? item.addonDeals
                : null,
            addonHotelServices:
              item.addonHotelServices && item.addonHotelServices.length > 0
                ? item.addonHotelServices
                : null,
            addonPrivateTransfers:
              item.addonPrivateTransfers &&
              item.addonPrivateTransfers.length > 0
                ? item.addonPrivateTransfers
                : null,
            marinaAddons:
              item.marinaAddons && item.marinaAddons.length > 0
                ? item.marinaAddons
                : null,
          })),
          passengers: passengersWithBase64,
          infantDocuments: infantDocumentsBase64,
          paymentMethod: 'ccavenue', // TEMPORARY: Always use CCAvenue
          totalAmount: totalAmountAED,
          paymentType,
          paymentAmount,
          currency,
        }),
      });

      const bookingResult = await bookingResponse.json();

      if (!bookingResponse.ok || !bookingResult.success) {
        throw new Error(bookingResult.error || 'Failed to create booking');
      }

      const bookingId = bookingResult.bookingId;
      const firstPassengerData = passengersToProcess[0];

      // The server may coerce an agent's booking to full payment - charge what
      // it recorded, not what this page computed.
      const chargeType: 'half' | 'full' =
        bookingResult.paymentType === 'half' ||
        bookingResult.paymentType === 'full'
          ? bookingResult.paymentType
          : paymentType;
      const chargeAmount =
        typeof bookingResult.paymentAmount === 'number' &&
        bookingResult.paymentAmount > 0
          ? bookingResult.paymentAmount
          : paymentAmount;

      // Initialize payment based on location
      // TEMPORARY: Using CCAvenue for ALL users (HDFC temporarily disabled)
      // Indian users: HDFC (INR), International users: CCAvenue (AED)
      // if (userLocation.isIndia) {
      //   // Use HDFC for Indian users (INR)
      //   await initializeHDFCPayment({
      //     bookingId,
      //     amount: paymentAmount,
      //     customerName: `${firstPassengerData.firstName} ${firstPassengerData.lastName}`,
      //     customerEmail: firstPassengerData.email,
      //     customerPhone: firstPassengerData.phone,
      //     paymentType,
      //   });
      // } else {
      //   // Use CCAvenue for international users only (AED)
      //   await initializeCCAvenuePayment({
      //     bookingId,
      //     amount: paymentAmount,
      //     customerName: `${firstPassengerData.firstName} ${firstPassengerData.lastName}`,
      //     customerEmail: firstPassengerData.email,
      //     customerPhone: firstPassengerData.phone,
      //     paymentType,
      //     billingCountry: userLocation.countryCode || 'AE',
      //   });
      // }

      // Use CCAvenue for ALL users temporarily
      await initializeCCAvenuePayment({
        bookingId,
        amount: chargeAmount,
        customerName: `${firstPassengerData.firstName} ${firstPassengerData.lastName}`,
        customerEmail: firstPassengerData.email,
        customerPhone: firstPassengerData.phone,
        paymentType: chargeType,
        billingCountry: userLocation.countryCode || 'AE',
      });
    } catch (error: any) {
      toast.error(
        error.message || 'Failed to process payment. Please try again.'
      );
      setIsSubmitting(false);
    }
  };

  const initializeHDFCPayment = async (params: {
    bookingId: string;
    amount: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    paymentType: 'half' | 'full';
  }) => {
    try {
      // Create HDFC order
      const orderResponse = await fetch('/api/payments/hdfc/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          currency: 'AED', // CCAvenue for international users - use AED
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // Create form and submit to HDFC
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = orderData.redirectUrl;

      const fields = {
        Merchant_Id: orderData.merchantId,
        Access_Code: orderData.accessCode,
        encRequest: orderData.encryptedData,
      };

      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (error: any) {
      toast.error(error.message || 'Failed to initialize payment');
      setIsSubmitting(false);
    }
  };

  const initializeCCAvenuePayment = async (params: {
    bookingId: string;
    amount: number;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    paymentType: 'half' | 'full';
    billingCountry?: string;
  }) => {
    try {
      // Create CCAvenue order
      const orderResponse = await fetch('/api/payments/ccavenue/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          currency: 'AED', // Dubai CCAvenue account uses AED
          billingCountry: params.billingCountry || 'AE',
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // Create form POST submission exactly as per official CCAvenue JSP example
      // Official format: POST to action URL with encRequest and access_code as form data
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = orderData.redirectUrl; // Clean URL: https://secure.ccavenue.ae/transaction/transaction.do?command=initiateTransaction

      // Official JSP example fields: encRequest and access_code ONLY (merchant_id is in encrypted data)
      const fields = {
        encRequest: orderData.encRequest, // Encrypted payment data
        access_code: orderData.accessCode, // Access code for authentication
      };

      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit(); // Auto-submit form (like JavaScript in JSP example)
    } catch (error: any) {
      toast.error(error.message || 'Failed to initialize payment');
      setIsSubmitting(false);
    }
  };

  if (bookingItems.length === 0) {
    if (hasPaymentError && isBookingLoaded) {
      // Payment callback sent user here with error (e.g. Oman visa user, decryption failed)
      return (
        <CheckoutShell>
          <div className='co'>
            <div className='container'>
              <div className='co-empty'>
                <span className='co-empty__icon' aria-hidden='true'>
                  <AlertCircle strokeWidth={2} />
                </span>
                <h1>Payment error</h1>
                <p>{paymentErrorText(paymentErrorCode)}</p>
                <div className='co-empty__actions'>
                  <Link
                    href='/visas/apply-for-oman-visa'
                    className='ui-btn ui-btn--outline ui-btn--lg'
                  >
                    Oman Visa Application
                  </Link>
                  <Link href='/' className='ui-btn ui-btn--dark ui-btn--lg'>
                    Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </CheckoutShell>
      );
    }
    // Loading the stored booking, or on the way to /holidays
    return <CheckoutLoading />;
  }

  const item = bookingItems[0];
  const isOtherCountry = passengers[0]?.country === 'Other';
  const backHref =
    item.returnPath ||
    (item.categorySlug === 'marina-cruise-dinner'
      ? `/marina-cruise-dinner/${item.packageSlug}`
      : `/category/${item.categorySlug}/${item.packageSlug}`);
  const travelDate = item.selectedDate
    ? parseDateStringToLocal(item.selectedDate)
    : null;
  const dateLabel = travelDate
    ? format(travelDate, 'EEE, d MMM yyyy')
    : 'Not selected';
  const travellersLabel = item.isSoloTraveller
    ? `Solo traveller · ${item.soloTravellerGender || 'N/A'}`
    : [
        `${item.adults} Adult${item.adults !== 1 ? 's' : ''}`,
        item.children > 0
          ? `${item.children} Child${item.children !== 1 ? 'ren' : ''}`
          : null,
        (item.infants || 0) > 0
          ? `${item.infants} Infant${item.infants !== 1 ? 's' : ''}`
          : null,
      ]
        .filter(Boolean)
        .join(' · ');
  const visaCount =
    (item.visaForAdults || 0) +
    (item.visaForChildren || 0) +
    (item.visaForInfants || 0);
  const duration =
    item.nights || item.days
      ? [
          item.days ? `${item.days} Day${item.days !== 1 ? 's' : ''}` : null,
          item.nights
            ? `${item.nights} Night${item.nights !== 1 ? 's' : ''}`
            : null,
        ]
          .filter(Boolean)
          .join(' / ')
      : null;

  // Offer add-ons (ids → names) and Marina add-ons (server labels)
  const offerAddonIds: string[] =
    item.categorySlug === 'offer-packages'
      ? [
          ...(item.addonDeals || []),
          ...(item.addonHotelServices || []),
          ...(item.addonPrivateTransfers || []),
        ]
      : [];
  const offerAddonLabels = offerAddonIds
    .map(id => addonNames[id])
    .filter((name): name is string => Boolean(name));
  const marinaAddonLabels =
    item.categorySlug === 'marina-cruise-dinner'
      ? item.marinaAddonLabels?.length
        ? item.marinaAddonLabels
        : item.marinaAddons || []
      : [];

  const fullBase = getTotalPrice();
  const halfBase = getTotalPrice() / 2;
  const withFee = (amount: number) =>
    amount + (amount * platformFeePercentage) / 100;
  const baseAmount = paymentType === 'half' ? halfBase : fullBase;
  const platformFee = (baseAmount * platformFeePercentage) / 100;
  const amountToPay = baseAmount + platformFee;
  const canPay =
    isPriced && !isSubmitting && !isLoadingLocation && !!userLocation;

  const sectionOpen = (id: string, errorPrefix?: string) =>
    !closedSections[id] ||
    (!!errorPrefix &&
      Object.keys(errors).some(key => key.startsWith(errorPrefix)));
  const toggleSection = (id: string) =>
    setClosedSections(prev => ({ ...prev, [id]: !prev[id] }));
  const showPaymentType = isPriced && !!userLocation && isAgentStatusResolved;
  const hasDealPrice =
    (item.hasActiveDeal || item.isDiscountActive) &&
    !!item.originalPrice &&
    item.originalPrice > item.price;

  return (
    <CheckoutShell>
      <div className='co'>
        <div className='container'>
          <header className='co-head'>
            <div>
              <h1>Checkout</h1>
              <p className='co-head__sub'>
                Fill in each traveller as on their passport, then pay to
                confirm your booking.
              </p>
            </div>
            <p className='co-head__alt'>
              Need a change? <Link href={backHref}>Change booking</Link>
            </p>
          </header>

          {hasPaymentError ? (
            <p className='ui-alert co-alert' role='alert'>
              <AlertCircle size={16} strokeWidth={2} aria-hidden='true' />
              <span>
                {paymentErrorText(paymentErrorCode)} Your booking is still
                here - check the details and pay again.
              </span>
            </p>
          ) : null}

          <div className='co-body'>
            <div className='co-main'>
              {passengers.map((passenger, index) => {
                if (isOtherCountry && index > 0) return null;

                const isLead = index === 0;
                const isChild = index >= totalAdults;
                const err = (field: keyof PassengerData) =>
                  errors[`passenger_${index}_${field}`];
                const fieldKey = (field: keyof PassengerData) =>
                  `passenger_${index}_${field}`;
                const sectionId = `traveller-${index}`;
                const open =
                  sectionOpen(sectionId, `passenger_${index}_`) ||
                  (isLead && !!errors.tourPickupLocation);

                return (
                  <Section
                    key={index}
                    id={sectionId}
                    title={
                      isLead
                        ? 'Lead Passenger Information'
                        : isChild
                          ? `Child ${index - totalAdults + 1}`
                          : `Passenger ${index + 1}`
                    }
                    sub={
                      isLead
                        ? 'We send the booking confirmation to these contact details.'
                        : isChild
                          ? 'Child traveller, details as on passport'
                          : 'Adult traveller, details as on passport'
                    }
                    open={open}
                    onToggle={() => toggleSection(sectionId)}
                    scope='mobile'
                  >
                    <div className='co-name'>
                      <Field
                        label='Salutation'
                        required
                        error={err('salutation')}
                      >
                        <div data-field={fieldKey('salutation')}>
                          <Select
                            value={passenger.salutation}
                            onChange={v =>
                              updatePassenger(index, 'salutation', v)
                            }
                            options={SALUTATIONS}
                            searchable={false}
                            invalid={!!err('salutation')}
                            aria-label='Salutation'
                          />
                        </div>
                      </Field>
                      <Field
                        label='First Name'
                        required
                        error={err('firstName')}
                        htmlFor={fieldKey('firstName')}
                      >
                        <input
                          id={fieldKey('firstName')}
                          type='text'
                          className='ui-input'
                          placeholder='As on passport'
                          autoComplete={isLead ? 'given-name' : 'off'}
                          value={passenger.firstName}
                          onChange={e =>
                            updatePassenger(index, 'firstName', e.target.value)
                          }
                          data-field={fieldKey('firstName')}
                        />
                      </Field>
                      <Field
                        label='Last Name'
                        required
                        error={err('lastName')}
                        htmlFor={fieldKey('lastName')}
                      >
                        <input
                          id={fieldKey('lastName')}
                          type='text'
                          className='ui-input'
                          placeholder='As on passport'
                          autoComplete={isLead ? 'family-name' : 'off'}
                          value={passenger.lastName}
                          onChange={e =>
                            updatePassenger(index, 'lastName', e.target.value)
                          }
                          data-field={fieldKey('lastName')}
                        />
                      </Field>
                    </div>

                    <div className='ui-grid co-grid'>
                      {isLead ? (
                        <>
                          <Field
                            label='Email Address'
                            required
                            error={err('email')}
                            htmlFor={fieldKey('email')}
                          >
                            <input
                              id={fieldKey('email')}
                              type='email'
                              className='ui-input'
                              placeholder='name@example.com'
                              autoComplete='email'
                              value={passenger.email}
                              onChange={e =>
                                updatePassenger(index, 'email', e.target.value)
                              }
                              data-field={fieldKey('email')}
                            />
                          </Field>
                          <Field
                            label='Phone Number'
                            required
                            error={err('phone')}
                            htmlFor={fieldKey('phone')}
                          >
                            <input
                              id={fieldKey('phone')}
                              type='tel'
                              className='ui-input'
                              placeholder='With country code'
                              autoComplete='tel'
                              value={passenger.phone}
                              onChange={e =>
                                updatePassenger(index, 'phone', e.target.value)
                              }
                              data-field={fieldKey('phone')}
                            />
                          </Field>
                          <Field
                            label='WhatsApp Contact Number'
                            required
                            error={err('whatsapp')}
                            htmlFor={fieldKey('whatsapp')}
                          >
                            <input
                              id={fieldKey('whatsapp')}
                              type='tel'
                              className='ui-input'
                              placeholder='With country code'
                              value={passenger.whatsapp}
                              onChange={e =>
                                updatePassenger(
                                  index,
                                  'whatsapp',
                                  e.target.value
                                )
                              }
                              data-field={fieldKey('whatsapp')}
                            />
                          </Field>
                          <Field
                            label='Country'
                            required
                            error={err('country')}
                            hint={
                              isOtherCountry && totalPassengers > 1
                                ? 'Only the lead traveller’s details are needed for this country.'
                                : undefined
                            }
                          >
                            <div data-field={fieldKey('country')}>
                              <Select
                                value={passenger.country}
                                onChange={v =>
                                  updatePassenger(index, 'country', v)
                                }
                                options={COUNTRIES}
                                placeholder='Select Country'
                                searchable={false}
                                invalid={!!err('country')}
                                aria-label='Country'
                              />
                            </div>
                          </Field>
                        </>
                      ) : null}

                      {!isLead && passengers[0]?.country === 'India' ? (
                        <Field
                          label='Nationality'
                          required
                          error={err('nationality')}
                        >
                          <div data-field={fieldKey('nationality')}>
                            <Select
                              value={passenger.nationality || ''}
                              onChange={v =>
                                updatePassenger(index, 'nationality', v)
                              }
                              options={NATIONALITIES}
                              placeholder='Select Nationality'
                              searchable={false}
                              invalid={!!err('nationality')}
                              aria-label='Nationality'
                            />
                          </div>
                        </Field>
                      ) : null}

                      {shouldShowPassportExpiry ? (
                        <Field
                          label='Passport Expiry Date'
                          required
                          error={err('passportExpiry')}
                          htmlFor={fieldKey('passportExpiry')}
                        >
                          <DateField
                            id={fieldKey('passportExpiry')}
                            value={passenger.passportExpiry}
                            onChange={iso =>
                              updatePassenger(index, 'passportExpiry', iso)
                            }
                            placeholder='Select expiry date'
                            invalid={!!err('passportExpiry')}
                            dataField={fieldKey('passportExpiry')}
                          />
                        </Field>
                      ) : null}

                      {isLead && !hasOnlyTours ? (
                        <Field
                          label='Permanent Address'
                          required
                          wide
                          error={err('permanentAddress')}
                          htmlFor={fieldKey('permanentAddress')}
                        >
                          <input
                            id={fieldKey('permanentAddress')}
                            type='text'
                            className='ui-input'
                            placeholder='House, street, city, PIN'
                            autoComplete='street-address'
                            value={passenger.permanentAddress}
                            onChange={e =>
                              updatePassenger(
                                index,
                                'permanentAddress',
                                e.target.value
                              )
                            }
                            data-field={fieldKey('permanentAddress')}
                          />
                        </Field>
                      ) : null}

                      {isLead && showTourPickup ? (
                        <div className='ui-field ui-field--wide co-pickups'>
                          <span className='co-pickups__label'>
                            Tour Pickup Location
                          </span>
                          {loadingTourPickups ? (
                            <p className='co-pickup is-loading'>
                              <Loader2
                                size={14}
                                className='spinning'
                                aria-hidden='true'
                              />
                              Loading pickup details...
                            </p>
                          ) : (
                            tourPickupLocations.map(tour => (
                              <p key={tour.packageId} className='co-pickup'>
                                <MapPin
                                  size={14}
                                  strokeWidth={2}
                                  aria-hidden='true'
                                />
                                <span>
                                  {tourItems.length > 1 ? (
                                    <b>{tour.packageName}: </b>
                                  ) : null}
                                  {tour.pickupLocation.trim() ||
                                    'Not specified — please contact support'}
                                </span>
                              </p>
                            ))
                          )}
                          {errors.tourPickupLocation ? (
                            <p className='ui-error'>
                              {errors.tourPickupLocation}
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    {shouldShowDocuments ? (
                      <div className='co-docs'>
                        <p className='co-docs__title'>
                          <FileText
                            size={15}
                            strokeWidth={2}
                            aria-hidden='true'
                          />
                          {isLead
                            ? 'Lead Passenger Documents'
                            : isChild
                              ? `Child ${index - totalAdults + 1} Documents`
                              : 'Documents'}
                        </p>
                        <div className='co-docs__grid'>
                          <FileUpload
                            label='Applicant Photo'
                            required
                            file={passenger.applicantPhoto}
                            onFileChange={file =>
                              handleFileUpload(index, 'applicantPhoto', file)
                            }
                            error={err('applicantPhoto')}
                            fieldKey={fieldKey('applicantPhoto')}
                          />
                          <FileUpload
                            label='Passport Main Copy [ Indian passport ]'
                            required
                            file={passenger.passportMainCopy}
                            onFileChange={file =>
                              handleFileUpload(index, 'passportMainCopy', file)
                            }
                            error={err('passportMainCopy')}
                            fieldKey={fieldKey('passportMainCopy')}
                          />
                          <FileUpload
                            label='Passport Last Page [ Indian passport ]'
                            file={passenger.passportLastPage}
                            onFileChange={file =>
                              handleFileUpload(index, 'passportLastPage', file)
                            }
                            error={err('passportLastPage')}
                            fieldKey={fieldKey('passportLastPage')}
                          />
                          <FileUpload
                            label='Passport Cover'
                            file={passenger.passportCover}
                            onFileChange={file =>
                              handleFileUpload(index, 'passportCover', file)
                            }
                            error={err('passportCover')}
                            fieldKey={fieldKey('passportCover')}
                          />
                          {!isChild ? (
                            <FileUpload
                              label='Pancard'
                              file={passenger.nationalIdCard}
                              onFileChange={file =>
                                handleFileUpload(index, 'nationalIdCard', file)
                              }
                              error={err('nationalIdCard')}
                              fieldKey={fieldKey('nationalIdCard')}
                            />
                          ) : (
                            <FileUpload
                              label='Birth Certificate'
                              required
                              file={passenger.birthCertificate}
                              onFileChange={file =>
                                handleFileUpload(
                                  index,
                                  'birthCertificate',
                                  file
                                )
                              }
                              error={err('birthCertificate')}
                              fieldKey={fieldKey('birthCertificate')}
                            />
                          )}
                        </div>
                        <p className='co-note'>
                          <AlertCircle
                            size={14}
                            strokeWidth={2}
                            aria-hidden='true'
                          />
                          Passport must have 2 blank pages and 6 months
                          validity.
                        </p>
                      </div>
                    ) : null}
                  </Section>
                );
              })}

              {shouldShowDocuments && totalInfants > 0
                ? infantDocuments.map((infant, infantIdx) => {
                    const sectionId = `infant-${infantIdx}`;
                    return (
                      <Section
                        key={infantIdx}
                        id={sectionId}
                        title={`Infant ${infantIdx + 1} Documents`}
                        sub='Photo, passport and birth certificate'
                        open={sectionOpen(sectionId, `infant_${infantIdx}_`)}
                        onToggle={() => toggleSection(sectionId)}
                        scope='mobile'
                      >
                        <div className='co-docs co-docs--flush'>
                          <div className='co-docs__grid'>
                            <FileUpload
                              label='Applicant Photo'
                              required
                              file={infant.applicantPhoto}
                              onFileChange={file =>
                                handleInfantDocumentUpload(
                                  infantIdx,
                                  'applicantPhoto',
                                  file
                                )
                              }
                              error={errors[`infant_${infantIdx}_applicantPhoto`]}
                              fieldKey={`infant_${infantIdx}_applicantPhoto`}
                            />
                            <FileUpload
                              label='Passport Main Copy [ Indian passport ]'
                              required
                              file={infant.passportMainCopy}
                              onFileChange={file =>
                                handleInfantDocumentUpload(
                                  infantIdx,
                                  'passportMainCopy',
                                  file
                                )
                              }
                              error={
                                errors[`infant_${infantIdx}_passportMainCopy`]
                              }
                              fieldKey={`infant_${infantIdx}_passportMainCopy`}
                            />
                            <FileUpload
                              label='Passport Last Page [ Indian passport ]'
                              file={infant.passportLastPage}
                              onFileChange={file =>
                                handleInfantDocumentUpload(
                                  infantIdx,
                                  'passportLastPage',
                                  file
                                )
                              }
                              fieldKey={`infant_${infantIdx}_passportLastPage`}
                            />
                            <FileUpload
                              label='Passport Cover'
                              file={infant.passportCover}
                              onFileChange={file =>
                                handleInfantDocumentUpload(
                                  infantIdx,
                                  'passportCover',
                                  file
                                )
                              }
                              fieldKey={`infant_${infantIdx}_passportCover`}
                            />
                            <FileUpload
                              label='Birth Certificate'
                              required
                              file={infant.birthCertificate}
                              onFileChange={file =>
                                handleInfantDocumentUpload(
                                  infantIdx,
                                  'birthCertificate',
                                  file
                                )
                              }
                              error={
                                errors[`infant_${infantIdx}_birthCertificate`]
                              }
                              fieldKey={`infant_${infantIdx}_birthCertificate`}
                            />
                          </div>
                        </div>
                      </Section>
                    );
                  })
                : null}

              {showPaymentType ? (
                <Section
                  id='payment'
                  title='Payment Method'
                  sub={
                    requiresFullPayment
                      ? isSubscribedAgent
                        ? 'Agent bookings are payable in full.'
                        : 'This booking is payable in full.'
                      : 'Pay in full now, or half now and the rest later.'
                  }
                  open={sectionOpen('payment')}
                  onToggle={() => toggleSection('payment')}
                  scope='mobile'
                >
                  <div
                    className='co-pay'
                    role='radiogroup'
                    aria-label='Payment Type'
                  >
                    <label
                      className={
                        'co-pay__opt' + (paymentType === 'full' ? ' is-on' : '')
                      }
                    >
                      <input
                        type='radio'
                        name='paymentType'
                        value='full'
                        checked={paymentType === 'full'}
                        onChange={e =>
                          setPaymentType(e.target.value as 'half' | 'full')
                        }
                      />
                      <span className='co-pay__amt'>
                        {formatPrice(withFee(fullBase))}
                      </span>
                      <span className='co-pay__text'>
                        <b>Full Payment</b>
                        <small>Pay the whole amount now</small>
                      </span>
                    </label>
                    {!requiresFullPayment ? (
                      <label
                        className={
                          'co-pay__opt' +
                          (paymentType === 'half' ? ' is-on' : '')
                        }
                      >
                        <input
                          type='radio'
                          name='paymentType'
                          value='half'
                          checked={paymentType === 'half'}
                          onChange={e =>
                            setPaymentType(e.target.value as 'half' | 'full')
                          }
                        />
                        <span className='co-pay__amt'>
                          {formatPrice(withFee(halfBase))}
                        </span>
                        <span className='co-pay__text'>
                          <b>Half Payment (50%)</b>
                          <small>Pay the rest before you travel</small>
                        </span>
                      </label>
                    ) : null}
                  </div>
                  <p className='co-protect'>
                    <span className='co-protect__icon' aria-hidden='true'>
                      <Lock size={13} strokeWidth={2.2} />
                    </span>
                    Payments are processed by CCAvenue with bank-level
                    encryption. We never see your card details.
                  </p>
                </Section>
              ) : null}
            </div>

            <aside className='co-aside'>
              <Section
                id='review'
                title='Order Review'
                sub={travellersLabel}
                open={sectionOpen('review')}
                onToggle={() => toggleSection('review')}
                scope='all'
              >
                <p className='co-sum__name'>
                  {item.packageName || (
                    <span
                      className='co-sum__skeleton'
                      aria-label='Loading package'
                    />
                  )}
                </p>
                {duration ? <p className='co-sum__dur'>{duration}</p> : null}
                <ul className='co-facts'>
                  <li>
                    <CalendarDays size={15} strokeWidth={2} aria-hidden='true' />
                    <span>{dateLabel}</span>
                  </li>
                  <li>
                    <Users size={15} strokeWidth={2} aria-hidden='true' />
                    <span>{travellersLabel}</span>
                  </li>
                  {item.withVisa && visaCount > 0 ? (
                    <li>
                      <FileText size={15} strokeWidth={2} aria-hidden='true' />
                      <span>
                        Visa for {visaCount} traveller
                        {visaCount !== 1 ? 's' : ''}
                      </span>
                    </li>
                  ) : null}
                </ul>

                {offerAddonIds.length > 0 ? (
                  <div className='co-addons'>
                    <span className='co-addons__label'>Offer add-ons</span>
                    {offerAddonLabels.length ? (
                      offerAddonLabels.map(label => (
                        <span key={label} className='co-chip'>
                          {label}
                        </span>
                      ))
                    ) : (
                      <span className='co-chip is-muted'>
                        {offerAddonIds.length} selected
                      </span>
                    )}
                  </div>
                ) : null}
                {marinaAddonLabels.length > 0 ? (
                  <div className='co-addons'>
                    <span className='co-addons__label'>Add-ons</span>
                    {marinaAddonLabels.map(label => (
                      <span key={label} className='co-chip'>
                        {label}
                      </span>
                    ))}
                  </div>
                ) : null}

                {item.hasActiveDeal || item.isDiscountActive ? (
                  <div className='co-badges'>
                    {item.hasActiveDeal ? (
                      <span className='co-badge is-deal'>Deal of the Day</span>
                    ) : (
                      <span className='co-badge'>Limited Offer Applied</span>
                    )}
                  </div>
                ) : null}
              </Section>

              <Section
                id='summary'
                title='Billing Summary'
                open={sectionOpen('summary')}
                onToggle={() => toggleSection('summary')}
                scope='all'
                foot={
                  <>
                    {isPriced ? (
                      <>
                        <div className='co-total'>
                          <span>Amount to Pay</span>
                          <b>{formatPrice(amountToPay)}</b>
                        </div>
                        {totalPassengers + totalInfants > 1 ? (
                          <p className='co-per'>
                            {formatPrice(
                              amountToPay / (totalPassengers + totalInfants)
                            )}{' '}
                            per person
                          </p>
                        ) : null}
                      </>
                    ) : null}
                    <button
                      type='button'
                      className='ui-btn ui-btn--primary ui-btn--lg ui-btn--block'
                      onClick={handlePayment}
                      disabled={!canPay}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2
                            size={15}
                            className='spinning'
                            aria-hidden='true'
                          />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock size={14} strokeWidth={2.2} aria-hidden='true' />
                          {isPriced
                            ? `Pay ${formatPrice(amountToPay)}`
                            : 'Pay with CCAvenue'}
                        </>
                      )}
                    </button>
                    <p className='co-secure'>
                      <ShieldCheck size={15} strokeWidth={2} aria-hidden='true' />
                      Secure payment with CCAvenue
                      {isLoadingLocation ? (
                        <span className='co-secure__loc'>
                          <Loader2
                            size={12}
                            className='spinning'
                            aria-hidden='true'
                          />
                          Detecting location...
                        </span>
                      ) : userLocation ? (
                        <span className='co-secure__loc'>
                          <Globe size={12} strokeWidth={2} aria-hidden='true' />
                          {userLocation.country}
                        </span>
                      ) : null}
                    </p>
                  </>
                }
              >
                {bookingError ? (
                  <p className='ui-alert co-sum__alert' role='alert'>
                    <AlertCircle size={15} strokeWidth={2} aria-hidden='true' />
                    <span>
                      {bookingError}. Please go back to the package and choose
                      again.
                    </span>
                  </p>
                ) : !isPriced ? (
                  <p className='co-sum__pricing'>
                    <Loader2 size={16} className='spinning' aria-hidden='true' />
                    Confirming your price…
                  </p>
                ) : (
                  <ul className='co-lines'>
                    <li>
                      <span>Package total</span>
                      <span className='co-lines__price'>
                        {hasDealPrice ? (
                          <s>{formatPrice(item.originalPrice!)}</s>
                        ) : null}
                        {formatPrice(fullBase)}
                      </span>
                    </li>
                    {item.agentDiscountAmount &&
                    item.agentDiscountAmount > 0 ? (
                      <li className='co-lines__badge'>
                        <AgentDiscountBadge
                          amount={`-${formatPrice(
                            item.agentDiscountAmount
                          ).replace('AED ', '')}`}
                        />
                      </li>
                    ) : null}
                    {userLocation && platformFeePercentage > 0 ? (
                      <>
                        <li>
                          <span>
                            {paymentType === 'half'
                              ? 'Half Payment'
                              : 'Full Payment'}
                          </span>
                          <span>{formatPrice(baseAmount)}</span>
                        </li>
                        <li>
                          <span>Platform Fee ({platformFeePercentage}%)</span>
                          <span>{formatPrice(platformFee)}</span>
                        </li>
                      </>
                    ) : null}
                  </ul>
                )}
              </Section>
            </aside>
          </div>
        </div>
      </div>
    </CheckoutShell>
  );
}

const SALUTATIONS = ['Mr', 'Mrs', 'Ms', 'Miss'];
const COUNTRIES = [
  { value: 'India', label: 'India' },
  { value: 'Other', label: 'Other' },
];
const NATIONALITIES = [
  'India',
  'UAE',
  'USA',
  'UK',
  'Canada',
  'Australia',
  'Other',
];

function paymentErrorText(code: string | null): string {
  return code === 'payment_cancelled'
    ? 'Payment was cancelled.'
    : code === 'payment_processing_failed'
      ? 'Payment processing failed. Please try again.'
      : 'Payment could not be completed. Please try again.';
}

function CheckoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={'desert-ember ex ' + EX_FONTS}>
      <ExHeader />
      <div className='at-site desert-ember'>{children}</div>
    </div>
  );
}

function CheckoutLoading() {
  return (
    <CheckoutShell>
      <div className='co'>
        <div className='container'>
          <div className='co-empty co-empty--loading'>
            <Loader2 size={28} className='spinning' aria-hidden='true' />
            <p>Loading your booking...</p>
          </div>
        </div>
      </div>
    </CheckoutShell>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutPageContent />
    </Suspense>
  );
}

function Section({
  id,
  title,
  sub,
  open,
  onToggle,
  scope,
  foot,
  children,
}: {
  id: string;
  title: string;
  sub?: string;
  open: boolean;
  onToggle: () => void;
  scope: 'all' | 'mobile';
  foot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className={
        'co-card co-card--' + scope + (open ? ' is-open' : ' is-closed')
      }
      aria-labelledby={`co-${id}-title`}
    >
      <h2 className='co-card__head' id={`co-${id}-title`}>
        <button
          type='button'
          className='co-card__toggle'
          aria-expanded={open}
          aria-controls={`co-${id}-body`}
          onClick={onToggle}
        >
          <span className='co-card__titles'>
            <span className='co-card__title'>{title}</span>
            {sub ? <span className='co-card__sub'>{sub}</span> : null}
          </span>
          <ChevronDown
            className='co-card__chev'
            size={18}
            strokeWidth={2.4}
            aria-hidden='true'
          />
        </button>
      </h2>
      <div id={`co-${id}-body`} className='co-card__body'>
        {children}
      </div>
      {foot ? <div className='co-card__foot'>{foot}</div> : null}
    </section>
  );
}

/** Label above the control, error (or hint) under it. */
function Field({
  label,
  required,
  error,
  hint,
  wide,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  wide?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={
        'ui-field' + (wide ? ' ui-field--wide' : '') + (error ? ' has-error' : '')
      }
    >
      <label className='ui-label' htmlFor={htmlFor}>
        {label}
        {required ? <em className='ui-req'>*</em> : null}
      </label>
      {children}
      {error ? (
        <p className='ui-error'>{error}</p>
      ) : hint ? (
        <p className='ui-hint'>{hint}</p>
      ) : null}
    </div>
  );
}

// File Upload Component - images only, drag and drop or click
function FileUpload({
  label,
  required,
  file,
  onFileChange,
  error,
  fieldKey,
}: {
  label: string;
  required?: boolean;
  file: File | null;
  onFileChange: (file: File | null) => void;
  error?: string;
  fieldKey: string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  );
  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      onFileChange(droppedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      onFileChange(selectedFile);
    }
    // the same file can be picked again after removing it
    e.target.value = '';
  };

  return (
    <div
      className={
        'co-file' +
        (isDragging ? ' is-dragging' : '') +
        (error ? ' is-error' : '') +
        (file ? ' has-file' : '')
      }
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-field={fieldKey}
    >
      <span className='co-file__thumb'>
        {file && previewUrl ? (
          <img src={previewUrl} alt='' />
        ) : (
          <ImagePlus size={22} strokeWidth={1.6} aria-hidden='true' />
        )}
      </span>
      <div className='co-file__info'>
        <span className='co-file__label'>
          {label}
          {required ? <em className='ui-req'>*</em> : null}
        </span>
        <span className='co-file__hint' title={file?.name}>
          {file ? file.name : 'Photo or scan · drag and drop it here'}
        </span>
        {error ? <p className='ui-error'>{error}</p> : null}
      </div>
      <div className='co-file__actions'>
        <input
          type='file'
          accept='image/*'
          onChange={handleFileInput}
          className='co-file__input'
          id={fieldKey}
        />
        <label
          htmlFor={fieldKey}
          className={'co-file__btn' + (file ? ' is-soft' : '')}
        >
          {file ? 'Replace' : 'Upload'}
        </label>
        {file ? (
          <button
            type='button'
            onClick={() => onFileChange(null)}
            className='co-file__remove'
            aria-label={`Remove ${label}`}
          >
            <X size={15} strokeWidth={2.2} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
