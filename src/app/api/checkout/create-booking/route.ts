import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { v2 as cloudinary } from 'cloudinary';
import { hashReferralCode } from '@/lib/referral-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

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
    // Referral data
    referralCode?: string | null;
    referralId?: string | null;
    referralDiscountApplied?: boolean;
  }>;
  passengers: PassengerData[];
  paymentMethod: string;
  totalAmount: number;
  paymentType?: 'half' | 'full';
  paymentAmount?: number;
  currency?: string;
}

// Upload base64 image to Cloudinary
async function uploadBase64ToCloudinary(
  base64String: string,
  folder: string = 'bookings/documents'
): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      base64String,
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error('Upload failed'));
        }
      }
    );
  });
}

export async function POST(req: NextRequest) {
  try {
    const body: BookingRequest = await req.json();

    const {
      cartItems,
      passengers,
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

    // Upload all documents to Cloudinary
    const uploadedDocuments: Array<{
      passengerIndex: number;
      applicantPhoto?: string;
      passportMainCopy?: string;
      passportLastPage?: string;
      passportCover?: string;
      nationalIdCard?: string;
    }> = [];

    for (let i = 0; i < passengers.length; i++) {
      const passenger = passengers[i];
      const passengerDocs: any = { passengerIndex: i };

      try {
        // Upload Applicant Photo
        if (passenger.applicantPhoto) {
          passengerDocs.applicantPhoto = await uploadBase64ToCloudinary(
            passenger.applicantPhoto,
            'bookings/documents'
          );
        }

        // Upload Passport Main Copy
        if (passenger.passportMainCopy) {
          passengerDocs.passportMainCopy = await uploadBase64ToCloudinary(
            passenger.passportMainCopy,
            'bookings/documents'
          );
        }

        // Upload Passport Last Page
        if (passenger.passportLastPage) {
          passengerDocs.passportLastPage = await uploadBase64ToCloudinary(
            passenger.passportLastPage,
            'bookings/documents'
          );
        }

        // Upload Passport Cover
        if (passenger.passportCover) {
          passengerDocs.passportCover = await uploadBase64ToCloudinary(
            passenger.passportCover,
            'bookings/documents'
          );
        }

        // Upload National ID Card
        if (passenger.nationalIdCard) {
          passengerDocs.nationalIdCard = await uploadBase64ToCloudinary(
            passenger.nationalIdCard,
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
        },
      };
    });

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

    const bookingData: any = {
      package_ids: packageIds,
      total_amount: totalAmount,
      payment_method: dbPaymentMethod, // Use valid constraint value
      payment_status: 'pending',
      booking_status: 'pending',
      passengers: passengerData,
      cart_items: cartItems,
      created_at: new Date().toISOString(),
      // Solo traveller metadata (optional)
      is_solo_traveller: hasSoloTraveller || false,
      solo_traveller_gender: soloItem?.soloTravellerGender || null,
      solo_traveller_share_consent:
        soloItem?.soloTravellerShareConsent ?? false,
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

    // Validate and store referral if present
    let referralId: string | null = null;
    const firstCartItem = cartItems[0];
    if (firstCartItem?.referralId && firstCartItem?.referralCode) {
      // Validate referral code one more time before storing
      const referralCodeHash = hashReferralCode(firstCartItem.referralCode);
      
      const { data: referral } = await supabaseAdmin
        .from('agent_referrals')
        .select('id, agent_id, discount_applied, status, expires_at')
        .eq('referral_code_hash', referralCodeHash)
        .eq('id', firstCartItem.referralId)
        .eq('status', 'active')
        .single();

      if (referral && new Date(referral.expires_at) > new Date()) {
        referralId = referral.id;
        bookingData.referral_id = referralId;
        
        // Update referral with customer user_id if logged in
        // (We'll update booking_id after booking is created)
      }
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

    // Update referral with booking_id if referral exists
    if (referralId && booking.id) {
      await supabaseAdmin
        .from('agent_referrals')
        .update({ booking_id: booking.id, status: 'pending_commission' })
        .eq('id', referralId);
    }

    // Calculate and create commission if referral exists and discount was NOT applied
    if (referralId && firstCartItem && !firstCartItem.referralDiscountApplied) {
      try {
        const { data: referral } = await supabaseAdmin
          .from('agent_referrals')
          .select('agent_id')
          .eq('id', referralId)
          .single();

        if (referral) {
          // Commission rate: 10% of total amount (configurable)
          const commissionRate = 10.0; // Percentage
          const commissionAmount = (totalAmount * commissionRate) / 100;

          // Create commission record
          const { data: commission } = await supabaseAdmin
            .from('agent_commissions')
            .insert({
              agent_id: referral.agent_id,
              referral_id: referralId,
              booking_id: booking.id,
              amount: commissionAmount,
              currency: currency || 'AED',
              commission_rate: commissionRate,
              status: 'pending',
            })
            .select()
            .single();

          // Update wallet with pending commission
          if (commission) {
            await supabaseAdmin
              .from('agent_wallet')
              .insert({
                agent_id: referral.agent_id,
                commission_id: commission.id,
                amount: commissionAmount,
                currency: currency || 'AED',
                balance_type: 'pending',
                transaction_type: 'commission',
                description: `Commission from booking #${booking.id}`,
              });
          }
        }
      } catch (commissionError) {
        // Log error but don't fail booking creation
        console.error('[COMMISSION] Error creating commission:', commissionError);
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
