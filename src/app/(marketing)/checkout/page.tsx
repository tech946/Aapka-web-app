'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  X,
  CreditCard,
  Wallet,
  AlertCircle,
  Loader2,
  Globe,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  detectUserLocation,
  initializeExchangeRate,
  type UserLocation,
} from '@/lib/location-utils';
import { parseDateStringToLocal } from '@/lib/utils';
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
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, getTotalPrice, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [paymentType, setPaymentType] = useState<'half' | 'full'>('full');
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [platformFeePercentage, setPlatformFeePercentage] = useState<number>(0);

  // Check if any cart item is a tour (not a package)
  // Tours typically have "tour" in the category slug/name
  const isTourCheckout = cartItems.some(item => {
    const categorySlug = item.categorySlug?.toLowerCase() || '';
    return categorySlug.includes('tour');
  });

  // Check if any cart item is a flexible date package
  const hasFlexibleDatePackage = cartItems.some(item => {
    const categorySlug = item.categorySlug?.toLowerCase() || '';
    return categorySlug === 'flexible-date-packages';
  });

  // Check if any cart item has visa selected
  const hasVisaSelected = cartItems.some(item => item.withVisa === true);

  // For tours: only full payment. For packages/offer packages: allow half or full
  // Update payment type if cart changes and becomes a tour
  useEffect(() => {
    if (isTourCheckout) {
      // Force full payment when tours are in cart
      setPaymentType('full');
    }
  }, [isTourCheckout, cartItems.length]); // Update when tour status or cart changes

  // Calculate total passengers
  const totalAdults = cartItems.reduce(
    (sum, item) => sum + (item.isSoloTraveller ? 1 : item.adults),
    0
  );
  const totalChildren = cartItems.reduce(
    (sum, item) => sum + (item.isSoloTraveller ? 0 : item.children),
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
      });
    }
    return initial;
  });

  // Update passengers when cart changes
  useEffect(() => {
    const newTotal = cartItems.reduce(
      (sum, item) => sum + item.adults + item.children,
      0
    );
    if (newTotal !== totalPassengers) {
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
        });
      }
      setPassengers(newPassengers);
    }
  }, [cartItems]);

  // Redirect if cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      router.push('/cart');
    }
  }, [cartItems, router]);

  // For flexible date packages: only show documents if visa is selected
  // For other packages: show documents for India (preserve previous functionality)
  // Computed after passengers state is initialized
  const shouldShowDocuments = useMemo(() => {
    return hasFlexibleDatePackage
      ? hasVisaSelected
      : passengers[0]?.country === 'India';
  }, [hasFlexibleDatePackage, hasVisaSelected, passengers]);

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
    return `AED ${price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
      | 'nationalIdCard',
    file: File | null
  ) => {
    updatePassenger(index, field, file);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const leadPassenger = passengers[0];
    const isOtherCountry = leadPassenger?.country === 'Other';

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
      if (!passenger.passportExpiry) {
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
        // Only require pickup location for tours
        if (isTourCheckout && !passenger.pickupLocation.trim()) {
          newErrors[`passenger_${actualIndex}_pickupLocation`] =
            'Pickup location is required';
        }
        if (!passenger.permanentAddress.trim()) {
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
      // - For flexible date packages: only if visa is selected and not "Other" country
      // - For other packages: if India (preserve previous functionality)
      const requiresDocuments = hasFlexibleDatePackage
        ? hasVisaSelected && !isOtherCountry
        : !isOtherCountry;

      if (requiresDocuments) {
        if (!passenger.applicantPhoto) {
          newErrors[`passenger_${actualIndex}_applicantPhoto`] =
            'Applicant photo is required';
        }
        if (!passenger.passportMainCopy) {
          newErrors[`passenger_${actualIndex}_passportMainCopy`] =
            'Passport main copy is required';
        }
      }
    });

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
      // Scroll to first error
      const firstErrorKey = Object.keys(errors)[0];
      if (firstErrorKey) {
        const element = document.querySelector(
          `[data-field="${firstErrorKey}"]`
        );
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Validate minimum adults and total passengers for all packages
    for (const item of cartItems) {
      // Check total passengers (can't be 0)
      const totalPassengers = item.adults + item.children + (item.infants || 0);
      if (totalPassengers === 0) {
        toast.error(
          `Please select at least one passenger for "${item.packageName}". Please update your cart.`
        );
        return;
      }

      // All packages require at least 1 adult
      if (item.adults === 0) {
        toast.error(
          `At least 1 adult is required for "${item.packageName}". Please update your cart.`
        );
        return;
      }

      // Offer packages require minimum 2 adults
      if (item.categorySlug === 'offer-packages' && item.adults < 2) {
        toast.error(
          `Offer packages require a minimum of 2 adults. Please update "${item.packageName}" in your cart.`
        );
        return;
      }
    }

    // If cart contains tours, payment type must be 'full'
    if (isTourCheckout && paymentType === 'half') {
      toast.error(
        'Tours require full payment. Please select full payment option.'
      );
      setPaymentType('full');
      return;
    }

    if (!userLocation) {
      toast.error('Please wait while we detect your location...');
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
          cartItems: cartItems.map(item => ({
            packageId: item.packageId,
            adults: item.adults,
            children: item.children,
            infants: item.infants || 0,
            selectedDate: item.selectedDate,
            isSoloTraveller: item.isSoloTraveller ?? false,
            soloTravellerGender: item.soloTravellerGender ?? null,
            soloTravellerShareConsent: item.soloTravellerShareConsent ?? false,
          })),
          passengers: passengersWithBase64,
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
        amount: paymentAmount,
        customerName: `${firstPassengerData.firstName} ${firstPassengerData.lastName}`,
        customerEmail: firstPassengerData.email,
        customerPhone: firstPassengerData.phone,
        paymentType,
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

  if (cartItems.length === 0) {
    return null; // Will redirect
  }

  return (
    <div className='checkout-page'>
      <div className='checkout-container'>
        <div className='checkout-header'>
          <Link href='/cart' className='checkout-back-button'>
            <ArrowLeft size={20} />
            Back to Cart
          </Link>
          <h1>Checkout</h1>
        </div>

        <div className='checkout-content'>
          <div className='checkout-form-section'>
            {passengers
              .map((passenger, index) => {
                // If "Other" is selected, only show the first passenger
                const isOtherCountry = passengers[0]?.country === 'Other';
                if (isOtherCountry && index > 0) {
                  return null; // Don't render additional passengers for "Other"
                }

                return (
                  <div key={index} className='passenger-section'>
                    <h2 className='passenger-section-title'>
                      {index === 0
                        ? 'Lead Passenger Information'
                        : `Passenger ${index + 1}`}
                    </h2>

                    <div className='passenger-form'>
                      {/* Salutation */}
                      <div className='form-group'>
                        <label>
                          Salutation <span className='required'>*</span>
                        </label>
                        <select
                          value={passenger.salutation}
                          onChange={e =>
                            updatePassenger(index, 'salutation', e.target.value)
                          }
                          className={
                            errors[`passenger_${index}_salutation`]
                              ? 'error'
                              : ''
                          }
                          data-field={`passenger_${index}_salutation`}
                        >
                          <option value='Mr'>Mr</option>
                          <option value='Mrs'>Mrs</option>
                          <option value='Ms'>Ms</option>
                          <option value='Miss'>Miss</option>
                        </select>
                        {errors[`passenger_${index}_salutation`] && (
                          <span className='error-message'>
                            {errors[`passenger_${index}_salutation`]}
                          </span>
                        )}
                      </div>

                      {/* First Name */}
                      <div className='form-group'>
                        <label>
                          First Name <span className='required'>*</span>
                        </label>
                        <input
                          type='text'
                          placeholder='Enter First Name'
                          value={passenger.firstName}
                          onChange={e =>
                            updatePassenger(index, 'firstName', e.target.value)
                          }
                          className={
                            errors[`passenger_${index}_firstName`]
                              ? 'error'
                              : ''
                          }
                          data-field={`passenger_${index}_firstName`}
                        />
                        {errors[`passenger_${index}_firstName`] && (
                          <span className='error-message'>
                            {errors[`passenger_${index}_firstName`]}
                          </span>
                        )}
                      </div>

                      {/* Last Name */}
                      <div className='form-group'>
                        <label>
                          Last Name <span className='required'>*</span>
                        </label>
                        <input
                          type='text'
                          placeholder='Enter Last Name'
                          value={passenger.lastName}
                          onChange={e =>
                            updatePassenger(index, 'lastName', e.target.value)
                          }
                          className={
                            errors[`passenger_${index}_lastName`] ? 'error' : ''
                          }
                          data-field={`passenger_${index}_lastName`}
                        />
                        {errors[`passenger_${index}_lastName`] && (
                          <span className='error-message'>
                            {errors[`passenger_${index}_lastName`]}
                          </span>
                        )}
                      </div>

                      {/* Email - Only for first passenger */}
                      {index === 0 && (
                        <div className='form-group'>
                          <label>
                            Email Address <span className='required'>*</span>
                          </label>
                          <input
                            type='email'
                            placeholder='Enter Email Address'
                            value={passenger.email}
                            onChange={e =>
                              updatePassenger(index, 'email', e.target.value)
                            }
                            className={
                              errors[`passenger_${index}_email`] ? 'error' : ''
                            }
                            data-field={`passenger_${index}_email`}
                          />
                          {errors[`passenger_${index}_email`] && (
                            <span className='error-message'>
                              {errors[`passenger_${index}_email`]}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Phone - Only for first passenger */}
                      {index === 0 && (
                        <div className='form-group'>
                          <label>
                            Phone Number <span className='required'>*</span>
                          </label>
                          <input
                            type='tel'
                            placeholder='Enter Phone Number'
                            value={passenger.phone}
                            onChange={e =>
                              updatePassenger(index, 'phone', e.target.value)
                            }
                            className={
                              errors[`passenger_${index}_phone`] ? 'error' : ''
                            }
                            data-field={`passenger_${index}_phone`}
                          />
                          {errors[`passenger_${index}_phone`] && (
                            <span className='error-message'>
                              {errors[`passenger_${index}_phone`]}
                            </span>
                          )}
                        </div>
                      )}

                      {/* WhatsApp - Only for first passenger */}
                      {index === 0 && (
                        <div className='form-group'>
                          <label>
                            WhatsApp Contact Number{' '}
                            <span className='required'>*</span>
                          </label>
                          <input
                            type='tel'
                            placeholder='Enter WhatsApp Number'
                            value={passenger.whatsapp}
                            onChange={e =>
                              updatePassenger(index, 'whatsapp', e.target.value)
                            }
                            className={
                              errors[`passenger_${index}_whatsapp`]
                                ? 'error'
                                : ''
                            }
                            data-field={`passenger_${index}_whatsapp`}
                          />
                          {errors[`passenger_${index}_whatsapp`] && (
                            <span className='error-message'>
                              {errors[`passenger_${index}_whatsapp`]}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Country - Only for first passenger */}
                      {index === 0 && (
                        <div className='form-group'>
                          <label>
                            Country <span className='required'>*</span>
                          </label>
                          <select
                            value={passenger.country}
                            onChange={e =>
                              updatePassenger(index, 'country', e.target.value)
                            }
                            className={
                              errors[`passenger_${index}_country`]
                                ? 'error'
                                : ''
                            }
                            data-field={`passenger_${index}_country`}
                          >
                            <option value=''>Select Country</option>
                            <option value='India'>India</option>
                            <option value='Other'>Other</option>
                          </select>
                          {errors[`passenger_${index}_country`] && (
                            <span className='error-message'>
                              {errors[`passenger_${index}_country`]}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Nationality - Only for additional passengers and only if India */}
                      {index > 0 && passengers[0]?.country === 'India' && (
                        <div className='form-group'>
                          <label>
                            Nationality <span className='required'>*</span>
                          </label>
                          <select
                            value={passenger.nationality || ''}
                            onChange={e =>
                              updatePassenger(
                                index,
                                'nationality',
                                e.target.value
                              )
                            }
                            className={
                              errors[`passenger_${index}_nationality`]
                                ? 'error'
                                : ''
                            }
                            data-field={`passenger_${index}_nationality`}
                          >
                            <option value=''>Select Nationality</option>
                            <option value='India'>India</option>
                            <option value='UAE'>UAE</option>
                            <option value='USA'>USA</option>
                            <option value='UK'>UK</option>
                            <option value='Canada'>Canada</option>
                            <option value='Australia'>Australia</option>
                            <option value='Other'>Other</option>
                          </select>
                          {errors[`passenger_${index}_nationality`] && (
                            <span className='error-message'>
                              {errors[`passenger_${index}_nationality`]}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Pickup Location - Only for tours and first passenger */}
                      {index === 0 && isTourCheckout && (
                        <div className='form-group'>
                          <label>
                            Pickup Location in Dubai{' '}
                            <span className='required'>*</span>
                          </label>
                          <input
                            type='text'
                            placeholder='Enter Residence/Hotel Name'
                            value={passenger.pickupLocation}
                            onChange={e =>
                              updatePassenger(
                                index,
                                'pickupLocation',
                                e.target.value
                              )
                            }
                            className={
                              errors[`passenger_${index}_pickupLocation`]
                                ? 'error'
                                : ''
                            }
                            data-field={`passenger_${index}_pickupLocation`}
                          />
                          {errors[`passenger_${index}_pickupLocation`] && (
                            <span className='error-message'>
                              {errors[`passenger_${index}_pickupLocation`]}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Passport Expiry Date */}
                      <div className='form-group'>
                        <label>
                          Passport Expiry Date{' '}
                          <span className='required'>*</span>
                        </label>
                        <input
                          type='date'
                          value={passenger.passportExpiry}
                          onChange={e =>
                            updatePassenger(
                              index,
                              'passportExpiry',
                              e.target.value
                            )
                          }
                          className={
                            errors[`passenger_${index}_passportExpiry`]
                              ? 'error'
                              : ''
                          }
                          data-field={`passenger_${index}_passportExpiry`}
                        />
                        {errors[`passenger_${index}_passportExpiry`] && (
                          <span className='error-message'>
                            {errors[`passenger_${index}_passportExpiry`]}
                          </span>
                        )}
                      </div>

                      {/* Permanent Address - Only for first passenger */}
                      {index === 0 && (
                        <div className='form-group'>
                          <label>
                            Permanent Address{' '}
                            <span className='required'>*</span>
                          </label>
                          <input
                            type='text'
                            placeholder='Enter Permanent Address'
                            value={passenger.permanentAddress}
                            onChange={e =>
                              updatePassenger(
                                index,
                                'permanentAddress',
                                e.target.value
                              )
                            }
                            className={
                              errors[`passenger_${index}_permanentAddress`]
                                ? 'error'
                                : ''
                            }
                            data-field={`passenger_${index}_permanentAddress`}
                          />
                          {errors[`passenger_${index}_permanentAddress`] && (
                            <span className='error-message'>
                              {errors[`passenger_${index}_permanentAddress`]}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Documents Section */}
                      {/* For flexible date packages: only show if visa is selected */}
                      {/* For other packages: show for India (preserve previous functionality) */}
                      {shouldShowDocuments && (
                        <div className='documents-section'>
                          <h3 className='documents-title'>
                            {index === 0
                              ? 'Lead Passenger Documents'
                              : 'Documents'}
                          </h3>

                          <div className='documents-grid'>
                            {/* Applicant Photo */}
                            <div className='document-upload-group'>
                              <label>
                                Applicant Photo{' '}
                                <span className='required'>*</span>
                              </label>
                              <FileUpload
                                file={passenger.applicantPhoto}
                                onFileChange={file =>
                                  handleFileUpload(
                                    index,
                                    'applicantPhoto',
                                    file
                                  )
                                }
                                error={
                                  errors[`passenger_${index}_applicantPhoto`]
                                }
                                fieldKey={`passenger_${index}_applicantPhoto`}
                              />
                            </div>

                            {/* Passport Main Copy */}
                            <div className='document-upload-group'>
                              <label>
                                Passport Main Copy [ Indian passport ]{' '}
                                <span className='required'>*</span>
                              </label>
                              <FileUpload
                                file={passenger.passportMainCopy}
                                onFileChange={file =>
                                  handleFileUpload(
                                    index,
                                    'passportMainCopy',
                                    file
                                  )
                                }
                                error={
                                  errors[`passenger_${index}_passportMainCopy`]
                                }
                                fieldKey={`passenger_${index}_passportMainCopy`}
                              />
                            </div>

                            {/* Passport Last Page */}
                            <div className='document-upload-group'>
                              <label>Passport Last Page [ Indian passport ]</label>
                              <FileUpload
                                file={passenger.passportLastPage}
                                onFileChange={file =>
                                  handleFileUpload(
                                    index,
                                    'passportLastPage',
                                    file
                                  )
                                }
                                error={
                                  errors[`passenger_${index}_passportLastPage`]
                                }
                                fieldKey={`passenger_${index}_passportLastPage`}
                              />
                            </div>

                            {/* Passport Cover */}
                            <div className='document-upload-group'>
                              <label>Passport Cover</label>
                              <FileUpload
                                file={passenger.passportCover}
                                onFileChange={file =>
                                  handleFileUpload(
                                    index,
                                    'passportCover',
                                    file
                                  )
                                }
                                error={
                                  errors[`passenger_${index}_passportCover`]
                                }
                                fieldKey={`passenger_${index}_passportCover`}
                              />
                            </div>

                            {/* National ID Card Copy */}
                            <div className='document-upload-group'>
                              <label>National ID Card Copy</label>
                              <FileUpload
                                file={passenger.nationalIdCard}
                                onFileChange={file =>
                                  handleFileUpload(
                                    index,
                                    'nationalIdCard',
                                    file
                                  )
                                }
                                error={
                                  errors[`passenger_${index}_nationalIdCard`]
                                }
                                fieldKey={`passenger_${index}_nationalIdCard`}
                              />
                            </div>
                          </div>

                          {/* Important Note */}
                          <div className='passport-note'>
                            <AlertCircle size={16} />
                            <span>
                              Passport must have 2 blank pages and 6 months
                              validity.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
              .filter(Boolean)}
          </div>

          {/* Right Sidebar - Order Summary */}
          <div className='checkout-sidebar'>
            <div className='order-summary-card'>
              <h2>Order Summary</h2>

              {/* Package Details */}
              <div className='summary-packages'>
                {cartItems.map((item, idx) => (
                  <div key={idx} className='summary-package-item'>
                    <div className='package-info'>
                      <h4>{item.packageName}</h4>
                      <p className='package-date'>
                        Date:{' '}
                        {item.selectedDate
                          ? (() => {
                              const date = parseDateStringToLocal(
                                item.selectedDate
                              );
                              if (date) {
                                const isFlexibleDate = item.categorySlug === 'flexible-date-packages';
                                return format(date, isFlexibleDate ? 'MMM dd, yyyy hh:mm a' : 'MMM dd, yyyy');
                              }
                              return 'Not selected';
                            })()
                          : 'Not selected'}
                      </p>
                      <p className='package-persons'>
                        {item.isSoloTraveller
                          ? `Solo Traveller – ${
                              item.soloTravellerGender || 'N/A'
                            }`
                          : `${item.adults} Adult${
                              item.adults !== 1 ? 's' : ''
                            }${
                              item.children > 0
                                ? `, ${item.children} Child${
                                    item.children !== 1 ? 'ren' : ''
                                  }`
                                : ''
                            }`}
                      </p>
                      {item.isDiscountActive && (
                        <span className='checkout-discount-badge'>Limited Offer Applied</span>
                      )}
                    </div>
                    <div className='package-price'>
                      {item.isDiscountActive && item.originalPrice && item.originalPrice > item.price && (
                        <span className='checkout-original-price'>
                          {formatPrice(item.originalPrice)}
                        </span>
                      )}
                      {item.agentDiscountAmount && item.agentDiscountAmount > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span style={{ 
                            fontSize: '10px', 
                            fontWeight: 600, 
                            color: '#059669', 
                            background: '#d1fae5', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            Premium Partner Discount
                            <span style={{ color: '#047857', fontWeight: 700 }}>
                              -{formatPrice(item.agentDiscountAmount).replace('AED ', '')}
                            </span>
                          </span>
                        </div>
                      )}
                      <span className={item.isDiscountActive ? 'checkout-discounted-price' : ''}>
                        {formatPrice(item.price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className='summary-divider'></div>

              {/* Totals */}
              <div className='summary-totals'>
                <div className='summary-row'>
                  <span>Total Adults:</span>
                  <span>{totalAdults}</span>
                </div>
                {totalChildren > 0 && (
                  <div className='summary-row'>
                    <span>Total Children:</span>
                    <span>{totalChildren}</span>
                  </div>
                )}
                <div className='summary-row'>
                  <span>Total Amount:</span>
                  <span>{formatPrice(getTotalPrice())}</span>
                </div>
                {userLocation &&
                  platformFeePercentage > 0 &&
                  (() => {
                    const baseAmount =
                      paymentType === 'half'
                        ? getTotalPrice() / 2
                        : getTotalPrice();
                    const platformFee =
                      (baseAmount * platformFeePercentage) / 100;
                    const totalWithFee = baseAmount + platformFee;

                    return (
                      <>
                        <div
                          className='summary-row'
                          style={{ fontSize: '13px', color: '#666' }}
                        >
                          <span>
                            {paymentType === 'half'
                              ? 'Half Payment'
                              : 'Full Payment'}
                            :
                          </span>
                          <span>{formatPrice(baseAmount)}</span>
                        </div>
                        <div
                          className='summary-row'
                          style={{ fontSize: '13px', color: '#666' }}
                        >
                          <span>Platform Fee ({platformFeePercentage}%):</span>
                          <span>{formatPrice(platformFee)}</span>
                        </div>
                        <div
                          className='summary-row'
                          style={{
                            fontWeight: '600',
                            borderTop: '1px solid #eee',
                            paddingTop: '8px',
                            marginTop: '8px',
                          }}
                        >
                          <span>Amount to Pay:</span>
                          <span>{formatPrice(totalWithFee)}</span>
                        </div>
                      </>
                    );
                  })()}
                {isLoadingLocation && (
                  <div className='summary-row'>
                    <span>
                      <Loader2 size={14} className='spinning' /> Detecting
                      location...
                    </span>
                  </div>
                )}
                {userLocation && (
                  <div className='summary-row location-info'>
                    <span className='global-location'>
                      <Globe size={14} /> {userLocation.country}
                    </span>
                    <span className='gateway-badge'>CCAvenue</span>
                  </div>
                )}
              </div>

              {/* Payment Type Selection */}
              {userLocation && (
                <div className='payment-type-selection'>
                  <h3>Payment Type</h3>
                  <div className='payment-type-options'>
                    <label className='payment-type-option'>
                      <input
                        type='radio'
                        name='paymentType'
                        value='full'
                        checked={paymentType === 'full'}
                        onChange={e =>
                          setPaymentType(e.target.value as 'half' | 'full')
                        }
                      />
                      <div className='payment-type-content'>
                        <span className='payment-type-label'>Full Payment</span>
                        <span className='payment-type-amount'>
                          {(() => {
                            const baseAmount = getTotalPrice();
                            const fee =
                              (baseAmount * platformFeePercentage) / 100;
                            return formatPrice(baseAmount + fee);
                          })()}
                        </span>
                      </div>
                    </label>
                    {/* Only show half payment option for packages and offer packages, not for tours */}
                    {!isTourCheckout && (
                      <label className='payment-type-option'>
                        <input
                          type='radio'
                          name='paymentType'
                          value='half'
                          checked={paymentType === 'half'}
                          onChange={e =>
                            setPaymentType(e.target.value as 'half' | 'full')
                          }
                        />
                        <div className='payment-type-content'>
                          <span className='payment-type-label'>
                            Half Payment (50%)
                          </span>
                          <span className='payment-type-amount'>
                            {(() => {
                              const baseAmount = getTotalPrice() / 2;
                              const fee =
                                (baseAmount * platformFeePercentage) / 100;
                              return formatPrice(baseAmount + fee);
                            })()}
                          </span>
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Options */}
              <div className='payment-options'>
                <h3>Proceed to Payment</h3>
                <button
                  className='payment-button'
                  onClick={handlePayment}
                  disabled={isSubmitting || isLoadingLocation || !userLocation}
                >
                  <CreditCard size={20} />
                  Pay with CCAvenue
                </button>
                {isSubmitting && (
                  <div className='submitting-overlay'>
                    <Loader2 size={24} className='spinning' />
                    <span>Processing...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// File Upload Component
function FileUpload({
  file,
  onFileChange,
  error,
  fieldKey,
}: {
  file: File | null;
  onFileChange: (file: File | null) => void;
  error?: string;
  fieldKey: string;
}) {
  const [isDragging, setIsDragging] = useState(false);

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
  };

  return (
    <div
      className={`file-upload-area ${isDragging ? 'dragging' : ''} ${error ? 'error' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-field={fieldKey}
    >
      <input
        type='file'
        accept='image/*'
        onChange={handleFileInput}
        className='file-input'
        id={fieldKey}
      />
      {file ? (
        <div className='file-preview'>
          <img
            src={URL.createObjectURL(file)}
            alt='Preview'
            className='file-preview-image'
          />
          <button
            type='button'
            onClick={() => onFileChange(null)}
            className='file-remove-button'
          >
            <X size={16} />
          </button>
          <p className='file-name'>{file.name}</p>
        </div>
      ) : (
        <label htmlFor={fieldKey} className='file-upload-label'>
          <Upload size={24} />
          <span>Drag and drop a file here or click</span>
        </label>
      )}
      {error && <span className='error-message'>{error}</span>}
    </div>
  );
}
