import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { REFERRAL_COOKIE_NAME } from '@/lib/influencer-referral';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BUCKET_NAME = 'images';

// Upload base64 image to Supabase Storage (images bucket)
async function uploadBase64ToSupabase(
  base64String: string,
  folder: string = 'bookings/documents'
): Promise<string> {
  // Remove data URL prefix if present (e.g. "data:image/jpeg;base64,")
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
  country: string;
  pickupLocation: string;
  permanentAddress: string;
  passportExpiry: string;
  nationality?: string;
  applicantPhoto: string | null; // base64 string
  passportMainCopy: string | null; // base64 string
  passportLastPage: string | null; // base64 string
  passportCover: string | null; // base64 string
  nationalIdCard: string | null; // base64 string
  birthCertificate: string | null; // base64 string - for children
}

interface InfantDocumentData {
  applicantPhoto: string | null;
  passportMainCopy: string | null;
  passportLastPage: string | null;
  passportCover: string | null;
  birthCertificate: string | null;
  // Pancard not collected for infants
}

interface BookingRequest {
  cartItems: Array<{
    packageId: string;
    adults: number;
    children: number;
    infants: number;
    selectedDate: string | null;
    isSoloTraveller?: boolean;
    soloTravellerGender?: 'male' | 'female' | null;
    soloTravellerShareConsent?: boolean;
    // Referral tracking
    referralId?: string;
    referralCode?: string;
    referralDiscountApplied?: boolean;
    referralDiscountPercentage?: number;
    // Add-ons (offer packages)
    addonDeals?: string[] | null;
    addonHotelServices?: string[] | null;
    addonPrivateTransfers?: string[] | null;
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
    const body: BookingRequest = await req.json();

    const {
      cartItems,
      passengers,
      infantDocuments = [],
      paymentMethod,
      totalAmount,
      paymentType,
      paymentAmount,
      currency,
    } = body;

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart items are required' },
        { status: 400 }
      );
    }

    if (!passengers || passengers.length === 0) {
      return NextResponse.json(
        { error: 'Passenger information is required' },
        { status: 400 }
      );
    }

    // Upload all documents to Supabase Storage
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
      const passengerDocs: any = { passengerIndex: i };

      try {
        // Upload Applicant Photo
        if (passenger.applicantPhoto) {
          passengerDocs.applicantPhoto = await uploadBase64ToSupabase(
            passenger.applicantPhoto,
            'bookings/documents'
          );
        }

        // Upload Passport Main Copy
        if (passenger.passportMainCopy) {
          passengerDocs.passportMainCopy = await uploadBase64ToSupabase(
            passenger.passportMainCopy,
            'bookings/documents'
          );
        }

        // Upload Passport Last Page
        if (passenger.passportLastPage) {
          passengerDocs.passportLastPage = await uploadBase64ToSupabase(
            passenger.passportLastPage,
            'bookings/documents'
          );
        }

        // Upload Passport Cover
        if (passenger.passportCover) {
          passengerDocs.passportCover = await uploadBase64ToSupabase(
            passenger.passportCover,
            'bookings/documents'
          );
        }

        // Upload National ID Card / Pancard
        if (passenger.nationalIdCard) {
          passengerDocs.nationalIdCard = await uploadBase64ToSupabase(
            passenger.nationalIdCard,
            'bookings/documents'
          );
        }

        // Upload Birth Certificate (for children)
        if (passenger.birthCertificate) {
          passengerDocs.birthCertificate = await uploadBase64ToSupabase(
            passenger.birthCertificate,
            'bookings/documents'
          );
        }

        uploadedDocuments.push(passengerDocs);
      } catch (error) {
        return NextResponse.json(
          {
            error: `Failed to upload documents for passenger ${i + 1}`,
          },
          { status: 500 }
        );
      }
    }

    // Prepare passenger data with uploaded document URLs
    const passengerData = passengers.map((passenger, index) => {
      const docs = uploadedDocuments.find(d => d.passengerIndex === index);
      return {
        salutation: passenger.salutation,
        firstName: passenger.firstName,
        lastName: passenger.lastName,
        email: passenger.email,
        phone: passenger.phone,
        whatsapp: passenger.whatsapp,
        country: passenger.country,
        pickupLocation: passenger.pickupLocation,
        permanentAddress: passenger.permanentAddress,
        passportExpiry: passenger.passportExpiry,
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

    // Upload infant documents and prepare infant_documents for booking
    const infantDocumentsData: Array<{
      applicantPhoto: string | null;
      passportMainCopy: string | null;
      passportLastPage: string | null;
      passportCover: string | null;
      birthCertificate: string | null;
    }> = [];

    for (let i = 0; i < infantDocuments.length; i++) {
      const infant = infantDocuments[i];
      const infantDocs: any = {};
      try {
        if (infant.applicantPhoto) {
          infantDocs.applicantPhoto = await uploadBase64ToSupabase(
            infant.applicantPhoto,
            'bookings/documents'
          );
        } else infantDocs.applicantPhoto = null;
        if (infant.passportMainCopy) {
          infantDocs.passportMainCopy = await uploadBase64ToSupabase(
            infant.passportMainCopy,
            'bookings/documents'
          );
        } else infantDocs.passportMainCopy = null;
        if (infant.passportLastPage) {
          infantDocs.passportLastPage = await uploadBase64ToSupabase(
            infant.passportLastPage,
            'bookings/documents'
          );
        } else infantDocs.passportLastPage = null;
        if (infant.passportCover) {
          infantDocs.passportCover = await uploadBase64ToSupabase(
            infant.passportCover,
            'bookings/documents'
          );
        } else infantDocs.passportCover = null;
        if (infant.birthCertificate) {
          infantDocs.birthCertificate = await uploadBase64ToSupabase(
            infant.birthCertificate,
            'bookings/documents'
          );
        } else infantDocs.birthCertificate = null;
        infantDocumentsData.push(infantDocs);
      } catch (error) {
        return NextResponse.json(
          { error: `Failed to upload documents for infant ${i + 1}` },
          { status: 500 }
        );
      }
    }

    // Create booking record
    const packageIds = cartItems.map(item => item.packageId);

    // Map payment gateway to valid payment_method for database constraint
    // The database constraint only allows: 'card', 'wallet', 'cash', 'other'
    // We store the actual gateway in payment_gateway field
    let dbPaymentMethod = 'other'; // Default to 'other' for gateway payments
    if (
      paymentMethod === 'card' ||
      paymentMethod === 'wallet' ||
      paymentMethod === 'cash'
    ) {
      dbPaymentMethod = paymentMethod;
    }

    const hasSoloTraveller = cartItems.some(item => item.isSoloTraveller);
    const soloItem = cartItems.find(item => item.isSoloTraveller);
    
    // Find the first item with referral data (if any)
    const referralItem = cartItems.find(item => item.referralId);
    const referralId = referralItem?.referralId || null;
    const referralDiscountApplied = referralItem?.referralDiscountApplied || false;

    // Influencer referral: read from cookie (set when customer clicked /ref/CODE)
    let influencerReferralCode: string | null = null;
    try {
      const cookieStore = cookies();
      const refCookie = cookieStore.get(REFERRAL_COOKIE_NAME);
      if (refCookie?.value) influencerReferralCode = refCookie.value;
    } catch {
      // Ignore if cookies unavailable
    }

    const bookingData: any = {
      package_ids: packageIds,
      total_amount: totalAmount,
      payment_method: dbPaymentMethod, // Use valid constraint value
      payment_status: 'pending',
      booking_status: 'pending',
      passengers: passengerData,
      infant_documents: infantDocumentsData,
      cart_items: cartItems,
      created_at: new Date().toISOString(),
      // Solo traveller metadata (optional)
      is_solo_traveller: hasSoloTraveller || false,
      solo_traveller_gender: soloItem?.soloTravellerGender || null,
      solo_traveller_share_consent:
        soloItem?.soloTravellerShareConsent ?? false,
      // Referral tracking (for agent commission system)
      referral_id: referralId,
      // Influencer referral (from cookie, for commission on payment)
      ...(influencerReferralCode && { influencer_referral_code: influencerReferralCode }),
    };

    // Add payment fields if provided
    if (paymentType) {
      bookingData.payment_type = paymentType;
    }
    if (paymentAmount) {
      bookingData.payment_amount = paymentAmount;
    }
    if (currency) {
      bookingData.payment_amount_currency = currency;
    }
    // Store the actual payment gateway (hdfc or ccavenue)
    if (paymentMethod === 'hdfc' || paymentMethod === 'ccavenue') {
      bookingData.payment_gateway = paymentMethod;
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

    // Handle referral and commission tracking
    if (referralId && booking?.id) {
      try {
        // Verify the referral exists and is valid
        const { data: referral } = await supabaseAdmin
          .from('agent_referrals')
          .select('id, agent_id, link_type, discount_percentage, status')
          .eq('id', referralId)
          .eq('status', 'active')
          .single();

        if (referral) {
          // Update referral with booking info
          await supabaseAdmin
            .from('agent_referrals')
            .update({
              booking_id: booking.id,
              discount_applied: referral.link_type === 'discount',
              status: referral.link_type === 'discount' ? 'completed' : 'pending_commission',
              usage_count: (await supabaseAdmin.rpc('increment_referral_usage', { referral_id: referralId })) || 1,
            })
            .eq('id', referralId);

          // If it's a commission-type link (no discount), create pending commission
          if (referral.link_type === 'commission') {
            // Calculate commission (default 10% of booking total)
            const commissionRate = 10.00; // Can be made configurable later
            const commissionAmount = (totalAmount * commissionRate) / 100;

            // Create commission record
            const { data: commission, error: commissionError } = await supabaseAdmin
              .from('agent_commissions')
              .insert({
                agent_id: referral.agent_id,
                referral_id: referralId,
                booking_id: booking.id,
                amount: commissionAmount,
                currency: currency || 'AED',
                commission_rate: commissionRate,
                status: 'pending', // Will be approved on successful payment
              })
              .select('id')
              .single();

            if (!commissionError && commission) {
              // Create wallet entry as pending
              await supabaseAdmin
                .from('agent_wallet')
                .insert({
                  agent_id: referral.agent_id,
                  commission_id: commission.id,
                  amount: commissionAmount,
                  currency: currency || 'AED',
                  balance_type: 'pending',
                  transaction_type: 'commission',
                  description: `Commission for booking #${booking.id.slice(0, 8).toUpperCase()}`,
                });
            }
          }
        }
      } catch (referralError) {
        // Don't fail the booking if referral tracking fails
        console.error('Error tracking referral:', referralError);
      }
    }

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      booking,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Unexpected error occurred' },
      { status: 500 }
    );
  }
}
