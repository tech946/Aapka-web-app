import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { REFERRAL_COOKIE_NAME } from '@/lib/influencer-referral';
import { getLtdOccupiedSeatsByDate } from '@/lib/ltd-occupied-seats';
import { getOfferPackageTravelDates } from '@/lib/offer-package-dates';
import {
  getDubaiTodayDateString,
  isLimitedTimeDealExpired,
} from '@/lib/limited-time-deal-window';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET_NAME = 'images';

async function uploadBase64ToSupabase(
  base64String: string,
  folder: string = 'bookings/documents'
): Promise<string> {
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  const ext = base64String.includes('image/png') ? 'png' : 'jpg';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(path, buffer, {
      contentType: `image/${ext}`,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message || 'Failed to upload document');
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

interface PassengerData {
  salutation: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp: string;
  country?: string;
  pickupLocation?: string;
  permanentAddress?: string;
  passportExpiry?: string;
  nationality?: string;
  applicantPhoto?: string | null;
  passportMainCopy?: string | null;
  passportLastPage?: string | null;
  passportCover?: string | null;
  nationalIdCard?: string | null;
  birthCertificate?: string | null;
}

interface InfantDocumentData {
  applicantPhoto: string | null;
  passportMainCopy: string | null;
  passportLastPage: string | null;
  passportCover: string | null;
  birthCertificate: string | null;
}

interface LTDBookingRequest {
  limitedTimeDealId: string;
  cartItems: Array<{
    packageId: string;
    adults: number;
    children: number;
    infants: number;
    selectedDate: string | null;
    isSoloTraveller?: boolean;
    addonDeals?: string[] | null;
    addonHotelServices?: string[] | null;
    addonPrivateTransfers?: string[] | null;
    price?: number;
  }>;
  passengers: PassengerData[];
  infantDocuments?: InfantDocumentData[];
  paymentMethod: string;
  totalAmount: number;
  paymentType?: 'half' | 'full';
  paymentAmount?: number;
  currency?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: LTDBookingRequest = await req.json();

    const {
      limitedTimeDealId,
      cartItems,
      passengers,
      infantDocuments = [],
      paymentMethod,
      totalAmount,
      paymentType,
      paymentAmount,
      currency,
    } = body;

    if (!limitedTimeDealId) {
      return NextResponse.json(
        { error: 'limitedTimeDealId is required' },
        { status: 400 }
      );
    }

    // Validate single cart item
    if (!cartItems || cartItems.length !== 1) {
      return NextResponse.json(
        { error: 'Exactly one cart item is required for limited time deals' },
        { status: 400 }
      );
    }

    if (!passengers || passengers.length === 0) {
      return NextResponse.json(
        { error: 'Passenger information is required' },
        { status: 400 }
      );
    }

    const item = cartItems[0];

    // Solo traveller: always persist as 1 adult, 0 children, 0 infants (for reports & dashboard)
    const normalizedItem = {
      ...item,
      ...(item.isSoloTraveller
        ? { adults: 1, children: 0, infants: 0 }
        : {}),
    };

    // Fetch deal and validate
    const { data: deal, error: dealError } = await supabaseAdmin
      .from('limited_time_deals')
      .select(
        'id, offer_package_id, start_date, end_date, max_bookings_per_day, is_active'
      )
      .eq('id', limitedTimeDealId)
      .single();

    if (dealError || !deal) {
      return NextResponse.json(
        { error: 'Limited time deal not found' },
        { status: 404 }
      );
    }

    // The listing already hides deactivated and expired deals, but a tab left
    // open past the end date (or a bookmarked link) would otherwise still push a
    // booking through and take a payment on a dead deal. Re-check server-side.
    if (!deal.is_active) {
      return NextResponse.json(
        { error: 'This limited time deal is no longer available' },
        { status: 400 }
      );
    }

    if (isLimitedTimeDealExpired(deal.end_date)) {
      return NextResponse.json(
        { error: 'This limited time deal has expired' },
        { status: 400 }
      );
    }

    if (normalizedItem.packageId !== deal.offer_package_id) {
      return NextResponse.json(
        { error: 'Package does not match this limited time deal' },
        { status: 400 }
      );
    }

    const selectedDateStr = normalizedItem.selectedDate
      ? String(normalizedItem.selectedDate).split('T')[0]
      : null;
    if (!selectedDateStr) {
      return NextResponse.json(
        { error: 'Selected date is required' },
        { status: 400 }
      );
    }

    const { data: pkgForDates } = await supabaseAdmin
      .from('packages')
      .select('travel_dates')
      .eq('package_id', deal.offer_package_id)
      .maybeSingle();

    const allowedTravelDates = getOfferPackageTravelDates(
      pkgForDates?.travel_dates as Array<{ id?: string; value: string } | string> | null
    );

    if (allowedTravelDates.length > 0) {
      if (!allowedTravelDates.includes(selectedDateStr)) {
        return NextResponse.json(
          { error: 'Selected date is not an available travel date for this package' },
          { status: 400 }
        );
      }
    } else {
      // No admin-picked travel dates: the deal's own window is the calendar.
      // Clamp the lower bound to today so the past portion of a still-running
      // window is not bookable - this mirrors the availability endpoint, which
      // only offers today onwards.
      const startStr = String(deal.start_date).slice(0, 10);
      const endStr = String(deal.end_date).slice(0, 10);
      const earliest =
        startStr > getDubaiTodayDateString()
          ? startStr
          : getDubaiTodayDateString();
      if (selectedDateStr < earliest || selectedDateStr > endStr) {
        return NextResponse.json(
          { error: 'Selected date is outside the deal date range' },
          { status: 400 }
        );
      }
    }

    // Check availability: occupied < max_bookings_per_day
    const occupiedMap = await getLtdOccupiedSeatsByDate(limitedTimeDealId);
    const occupied = occupiedMap.get(selectedDateStr) || 0;
    const maxPerDay = Number(deal.max_bookings_per_day) || 48;
    const totalPersons =
      Number(normalizedItem.adults || 0) +
      Number(normalizedItem.children || 0) +
      Number(normalizedItem.infants || 0);

    if (occupied + totalPersons > maxPerDay) {
      return NextResponse.json(
        { error: 'Sorry, no availability for the selected date' },
        { status: 400 }
      );
    }

    // Upload documents and prepare passenger data (same logic as create-booking)
    const uploadedDocuments: Array<{
      passengerIndex: number;
      applicantPhoto?: string;
      passportMainCopy?: string;
      passportLastPage?: string;
      passportCover?: string;
      nationalIdCard?: string;
      birthCertificate?: string;
    }> = [];

    for (let i = 0; i < passengers.length; i++) {
      const passenger = passengers[i];
      const passengerDocs: Record<string, unknown> = { passengerIndex: i };

      try {
        if (passenger.applicantPhoto) {
          passengerDocs.applicantPhoto = await uploadBase64ToSupabase(
            passenger.applicantPhoto,
            'bookings/documents'
          );
        }
        if (passenger.passportMainCopy) {
          passengerDocs.passportMainCopy = await uploadBase64ToSupabase(
            passenger.passportMainCopy,
            'bookings/documents'
          );
        }
        if (passenger.passportLastPage) {
          passengerDocs.passportLastPage = await uploadBase64ToSupabase(
            passenger.passportLastPage,
            'bookings/documents'
          );
        }
        if (passenger.passportCover) {
          passengerDocs.passportCover = await uploadBase64ToSupabase(
            passenger.passportCover,
            'bookings/documents'
          );
        }
        if (passenger.nationalIdCard) {
          passengerDocs.nationalIdCard = await uploadBase64ToSupabase(
            passenger.nationalIdCard,
            'bookings/documents'
          );
        }
        if (passenger.birthCertificate) {
          passengerDocs.birthCertificate = await uploadBase64ToSupabase(
            passenger.birthCertificate,
            'bookings/documents'
          );
        }
        uploadedDocuments.push(passengerDocs as typeof uploadedDocuments[0]);
      } catch (error) {
        return NextResponse.json(
          { error: `Failed to upload documents for passenger ${i + 1}` },
          { status: 500 }
        );
      }
    }

    const passengerData = passengers.map((passenger, index) => {
      const docs = uploadedDocuments.find((d) => d.passengerIndex === index);
      return {
        salutation: passenger.salutation,
        firstName: passenger.firstName,
        lastName: passenger.lastName,
        email: passenger.email,
        phone: passenger.phone,
        whatsapp: passenger.whatsapp,
        country: passenger.country || '',
        pickupLocation: passenger.pickupLocation || '',
        permanentAddress: passenger.permanentAddress || '',
        passportExpiry: passenger.passportExpiry || '',
        nationality: passenger.nationality,
        documents: {
          applicantPhoto: docs?.applicantPhoto || null,
          passportMainCopy: docs?.passportMainCopy || null,
          passportLastPage: docs?.passportLastPage || null,
          passportCover: docs?.passportCover || null,
          nationalIdCard: docs?.nationalIdCard || null,
          birthCertificate: docs?.birthCertificate || null,
        },
      };
    });

    const infantDocumentsData: Array<{
      applicantPhoto: string | null;
      passportMainCopy: string | null;
      passportLastPage: string | null;
      passportCover: string | null;
      birthCertificate: string | null;
    }> = [];

    for (let i = 0; i < infantDocuments.length; i++) {
      const infant = infantDocuments[i];
      const infantDocs: Record<string, string | null> = {};
      try {
        infantDocs.applicantPhoto = infant.applicantPhoto
          ? await uploadBase64ToSupabase(infant.applicantPhoto, 'bookings/documents')
          : null;
        infantDocs.passportMainCopy = infant.passportMainCopy
          ? await uploadBase64ToSupabase(infant.passportMainCopy, 'bookings/documents')
          : null;
        infantDocs.passportLastPage = infant.passportLastPage
          ? await uploadBase64ToSupabase(infant.passportLastPage, 'bookings/documents')
          : null;
        infantDocs.passportCover = infant.passportCover
          ? await uploadBase64ToSupabase(infant.passportCover, 'bookings/documents')
          : null;
        infantDocs.birthCertificate = infant.birthCertificate
          ? await uploadBase64ToSupabase(infant.birthCertificate, 'bookings/documents')
          : null;
        infantDocumentsData.push(infantDocs as typeof infantDocumentsData[0]);
      } catch (error) {
        return NextResponse.json(
          { error: `Failed to upload documents for infant ${i + 1}` },
          { status: 500 }
        );
      }
    }

    // Build cart item with price for email
    const cartItemWithPrice = {
      ...normalizedItem,
      price: normalizedItem.price ?? totalAmount,
    };

    let dbPaymentMethod = 'other';
    if (paymentMethod === 'card' || paymentMethod === 'wallet' || paymentMethod === 'cash') {
      dbPaymentMethod = paymentMethod;
    }

    let influencerReferralCode: string | null = null;
    try {
      const cookieStore = cookies();
      const refCookie = cookieStore.get(REFERRAL_COOKIE_NAME);
      if (refCookie?.value) influencerReferralCode = refCookie.value;
    } catch {
      // Ignore
    }

    const bookingData: Record<string, unknown> = {
      package_ids: [normalizedItem.packageId],
      total_amount: totalAmount,
      payment_method: dbPaymentMethod,
      payment_status: 'pending',
      booking_status: 'pending',
      passengers: passengerData,
      infant_documents: infantDocumentsData,
      cart_items: [cartItemWithPrice],
      created_at: new Date().toISOString(),
      limited_time_deal_id: limitedTimeDealId,
      is_solo_traveller: normalizedItem.isSoloTraveller || false,
      solo_traveller_gender: null,
      solo_traveller_share_consent: false,
      referral_id: null,
    };

    if (paymentType) {
      (bookingData as Record<string, string>).payment_type = paymentType;
    }
    if (paymentAmount) {
      (bookingData as Record<string, number>).payment_amount = paymentAmount;
    }
    if (currency) {
      (bookingData as Record<string, string>).payment_amount_currency = currency;
    }
    if (paymentMethod === 'hdfc' || paymentMethod === 'ccavenue') {
      (bookingData as Record<string, string>).payment_gateway = paymentMethod;
    }
    if (influencerReferralCode) {
      (bookingData as Record<string, string>).influencer_referral_code = influencerReferralCode;
    }

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (bookingError) {
      return NextResponse.json(
        { error: 'Failed to create booking', details: bookingError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      booking,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
