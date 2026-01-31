import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { v2 as cloudinary } from 'cloudinary';

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
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Unexpected error occurred' },
      { status: 500 }
    );
  }
}
