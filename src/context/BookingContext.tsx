'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { AcceptPayment } from '@/lib/package-payment';

/* ==========================================================================
   The one package being booked. There is no cart: "Book now" on a package
   page replaces whatever was here and goes straight to /checkout. Only the
   traveller's choices are stored; prices always come from the server
   (/api/booking/validate), never from the browser.
   ========================================================================== */

// What the package page hands over (stored in localStorage, no prices)
export interface BookingRequest {
  packageId: string;
  packageSlug: string;
  categorySlug: string;
  adults: number;
  children: number;
  infants: number;
  selectedDate: string | null;
  // Solo traveller support
  isSoloTraveller?: boolean;
  soloTravellerGender?: 'male' | 'female' | null;
  soloTravellerShareConsent?: boolean;
  // Visa support
  withVisa?: boolean;
  visaForAdults?: number;
  visaForChildren?: number;
  visaForInfants?: number;
  // Referral tracking (for agent commission/discount system)
  referralId?: string;              // UUID of the referral record in DB
  referralCode?: string;            // The actual referral code (for tracking)
  referralDiscountApplied?: boolean; // true if discount link, false if commission link
  referralDiscountPercentage?: number; // Discount % from the referral (locked at creation)
  // Add-ons (offer packages)
  addonDeals?: string[];
  addonHotelServices?: string[];
  addonPrivateTransfers?: string[];
  // Marina cruise add-ons (package JSONB)
  marinaAddons?: string[];
  /** the package page this booking was started on ("Change booking") */
  returnPath?: string;
}

// The booking with validated prices from the server
export interface BookingItem extends BookingRequest {
  packageName: string;
  thumbnailImage: string | null;
  price: number;
  originalPrice?: number | null; // Original price before discount
  adultPrice: number | null;
  childPrice: number | null;
  infantPrice: number | null;
  basePrice: number | null;
  isPackageType: boolean;
  nights?: number | null;
  days?: number | null;
  validated?: boolean; // Flag to indicate if price is validated
  // Discount info
  isDiscountActive?: boolean;
  hasActiveDeal?: boolean;
  adultDiscountAmount?: number | null;
  childDiscountAmount?: number | null;
  infantDiscountAmount?: number | null;
  // Agent discount info (for logged-in agents)
  agentDiscountAmount?: number | null;
  // Referral discount info (for customers via referral link)
  referralDiscountAmount?: number | null;
  priceBeforeReferralDiscount?: number | null;
  /** Per-package checkout rule: 'full' hides the half-payment option */
  acceptPayment?: AcceptPayment;
  /** Date-range surcharge from surcharge_master (included in price) */
  dateSurcharge?: number | null;
  /** Resolved add-on names after server validation (marina cruise) */
  marinaAddonLabels?: string[];
}

interface BookingContextType {
  /** null until a package page starts a booking */
  booking: BookingItem | null;
  /** Replaces any earlier booking with this one and prices it. */
  startBooking: (request: BookingRequest) => void;
  clearBooking: () => void;
  /** true while the server is pricing the booking */
  isValidating: boolean;
  /** why the server would not price it (package gone, date taken…) */
  bookingError: string | null;
  /** false until the stored booking has been read on this visit */
  isLoaded: boolean;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const BOOKING_STORAGE_KEY = 'aapka_tourism_booking';
// the old multi-item cart; dropped on first load
const LEGACY_CART_STORAGE_KEY = 'aapka_tourism_cart';

function toStorage(item: BookingRequest): BookingRequest {
  return {
    packageId: item.packageId,
    packageSlug: item.packageSlug,
    categorySlug: item.categorySlug,
    adults: item.adults,
    children: item.children,
    infants: item.infants || 0,
    selectedDate: item.selectedDate ?? null,
    isSoloTraveller: item.isSoloTraveller ?? false,
    soloTravellerGender: item.soloTravellerGender ?? null,
    soloTravellerShareConsent: item.soloTravellerShareConsent ?? false,
    withVisa: item.withVisa ?? false,
    visaForAdults: item.visaForAdults ?? 0,
    visaForChildren: item.visaForChildren ?? 0,
    visaForInfants: item.visaForInfants ?? 0,
    // Referral tracking
    referralId: item.referralId,
    referralCode: item.referralCode,
    referralDiscountApplied: item.referralDiscountApplied,
    referralDiscountPercentage: item.referralDiscountPercentage,
    addonDeals: item.addonDeals,
    addonHotelServices: item.addonHotelServices,
    addonPrivateTransfers: item.addonPrivateTransfers,
    marinaAddons: item.marinaAddons,
    returnPath: item.returnPath,
  };
}

/** A request with no prices yet (validated: false). */
function unpriced(request: BookingRequest): BookingItem {
  return {
    ...toStorage(request),
    packageName: '',
    thumbnailImage: null,
    price: 0,
    adultPrice: null,
    childPrice: null,
    infantPrice: null,
    basePrice: null,
    isPackageType: false,
    validated: false,
  };
}

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [booking, setBooking] = useState<BookingItem | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  // only the newest pricing request may write its answer
  const requestSeq = useRef(0);

  // Price the booking on the server (including every discount)
  const validate = useCallback(async (request: BookingRequest) => {
    const seq = ++requestSeq.current;
    setIsValidating(true);
    setBookingError(null);
    try {
      const response = await fetch('/api/booking/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              packageId: request.packageId,
              categorySlug: request.categorySlug,
              adults: request.adults,
              children: request.children,
              infants: request.infants,
              selectedDate: request.selectedDate,
              isSoloTraveller: request.isSoloTraveller ?? false,
              withVisa: request.withVisa ?? false,
              visaForAdults: request.visaForAdults ?? 0,
              visaForChildren: request.visaForChildren ?? 0,
              visaForInfants: request.visaForInfants ?? 0,
              // Referral tracking - these come from DB lookup, not URL params
              referralId: request.referralId,
              referralDiscountApplied: request.referralDiscountApplied ?? false,
              referralDiscountPercentage: request.referralDiscountPercentage ?? 0,
              // Add-ons (offer packages)
              addonDeals: request.addonDeals,
              addonHotelServices: request.addonHotelServices,
              addonPrivateTransfers: request.addonPrivateTransfers,
              marinaAddons: request.marinaAddons,
            },
          ],
        }),
      });

      const result = await response.json();
      if (seq !== requestSeq.current) return;

      const validated = result?.items?.find((v: any) => v.valid);
      if (!response.ok || !result.success || !validated) {
        const reason =
          result?.invalidItems?.[0]?.error || result?.error || 'This package could not be priced';
        setBookingError(reason);
        return;
      }

      setBooking(prev =>
        prev && prev.packageId === request.packageId
          ? {
              ...prev,
              packageName: validated.packageName,
              price: validated.price,
              originalPrice: validated.originalPrice,
              adultPrice: validated.adultPrice,
              childPrice: validated.childPrice,
              infantPrice: validated.infantPrice,
              basePrice: validated.basePrice,
              nights: validated.nights,
              days: validated.days,
              thumbnailImage: validated.thumbnailImage,
              validated: true,
              // Discount info
              isDiscountActive: validated.isDiscountActive,
              hasActiveDeal: validated.hasActiveDeal || false,
              adultDiscountAmount: validated.adultDiscountAmount,
              childDiscountAmount: validated.childDiscountAmount,
              infantDiscountAmount: validated.infantDiscountAmount,
              // Agent discount info (for logged-in agents)
              agentDiscountAmount: validated.agentDiscountAmount,
              // Referral discount info (for customers via referral link)
              referralDiscountAmount: validated.referralDiscountAmount,
              priceBeforeReferralDiscount: validated.priceBeforeReferralDiscount,
              // Server-supplied payment rule for this package
              acceptPayment: validated.acceptPayment,
              dateSurcharge: validated.dateSurcharge ?? null,
              marinaAddonLabels: validated.marinaAddonLabels,
            }
          : prev
      );
    } catch {
      if (seq === requestSeq.current) {
        setBookingError('We could not reach the server to price this booking');
      }
    } finally {
      if (seq === requestSeq.current) setIsValidating(false);
    }
  }, []);

  // Load the booking from localStorage on mount (and re-price it)
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_CART_STORAGE_KEY);
      const stored = localStorage.getItem(BOOKING_STORAGE_KEY);
      if (stored) {
        const parsed: BookingRequest = JSON.parse(stored);
        if (parsed && parsed.packageId) {
          setBooking(unpriced(parsed));
          validate(parsed);
        }
      }
    } catch {
      // storage blocked or corrupt: start without a booking
    } finally {
      setIsLoaded(true);
    }
  }, [validate]);

  // Save only the traveller's choices
  useEffect(() => {
    if (!isLoaded) return;
    try {
      if (booking) {
        localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(toStorage(booking)));
      } else {
        localStorage.removeItem(BOOKING_STORAGE_KEY);
      }
    } catch {
      // storage blocked (private mode): the booking still works for this visit
    }
  }, [booking, isLoaded]);

  const startBooking = useCallback(
    (request: BookingRequest) => {
      const withReturn: BookingRequest = {
        ...request,
        returnPath:
          request.returnPath ??
          (typeof window !== 'undefined'
            ? window.location.pathname + window.location.search
            : undefined),
      };
      setBooking(unpriced(withReturn));
      validate(withReturn);
    },
    [validate]
  );

  const clearBooking = useCallback(() => {
    requestSeq.current++;
    setBooking(null);
    setBookingError(null);
    setIsValidating(false);
  }, []);

  return (
    <BookingContext.Provider
      value={{
        booking,
        startBooking,
        clearBooking,
        isValidating,
        bookingError,
        isLoaded,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
