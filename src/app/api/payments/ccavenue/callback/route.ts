import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { redirectResponseToJson } from '@/lib/ccavenue-crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Handle POST requests (CCAvenue sends POST with encResp in body)
export async function POST(req: NextRequest) {
  return handleCallback(req);
}

// Also handle GET for compatibility
export async function GET(req: NextRequest) {
  return handleCallback(req);
}

async function handleCallback(req: NextRequest) {
  try {
    let encryptedResponse = '';

    // According to the guide, CCAvenue sends POST with encResp in request body
    // In Pages Router: req.body.encResp
    // In App Router: we need to parse the body ourselves
    if (req.method === 'POST') {
      try {
        // CCAvenue sends form-encoded data: encResp=XXX
        const bodyText = await req.text();

        // Parse as URL-encoded form data (most common format)
        const params = new URLSearchParams(bodyText);
        encryptedResponse = params.get('encResp') || '';

        // If not found, try to extract from raw body string
        if (!encryptedResponse && bodyText.includes('encResp=')) {
          // Handle URL-encoded value
          const match = bodyText.match(/encResp=([^&]+)/);
          if (match) {
            encryptedResponse = decodeURIComponent(match[1]);
          }
        }
      } catch (e) {
        // Error parsing POST data
      }
    } else {
      // GET request - check query params (for testing/debugging)
      const searchParams = req.nextUrl.searchParams;
      encryptedResponse = searchParams.get('encResp') || '';
    }

    if (!encryptedResponse) {
      return NextResponse.redirect(
        new URL('/checkout?error=payment_failed', req.nextUrl.origin)
      );
    }

    // Using working key directly (matching create-order)
    const workingKey = '5E25D58B6BF1633A1525984EB4E2E944';

    // Fallback to env if needed (for production)
    // const workingKey = process.env.CCAVENUE_WORKING_KEY || '5E25D58B6BF1633A1525984EB4E2E944';

    if (!workingKey) {
      return NextResponse.redirect(
        new URL('/checkout?error=payment_processing_failed', req.nextUrl.origin)
      );
    }

    // Use the guide's method to decrypt and parse response
    const data = redirectResponseToJson(encryptedResponse, workingKey);

    const orderStatus = data.order_status;
    const orderId = data.order_id;
    const amount = data.amount;
    const currency = data.currency || 'AED'; // Get currency from response
    const bookingId = data.merchant_param1 || '';
    const paymentType = data.merchant_param2 || 'full';
    const trackingId = data.tracking_id || '';

    if (orderStatus !== 'Success') {
      // Payment failed
      return NextResponse.redirect(
        new URL(
          `/checkout?error=payment_failed&bookingId=${bookingId}`,
          req.nextUrl.origin
        )
      );
    }

    // Update booking with payment details
    const paymentAmount = parseFloat(amount || '0');

    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        payment_status: 'completed',
        payment_transaction_id: trackingId || orderId,
        payment_amount: paymentAmount,
        payment_amount_currency: currency, // Use actual currency from response
        payment_type: paymentType,
        payment_gateway: 'ccavenue',
        payment_done: paymentType,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      return NextResponse.redirect(
        new URL(
          `/checkout?error=payment_verified_but_update_failed&bookingId=${bookingId}`,
          req.nextUrl.origin
        )
      );
    }

    // Fetch booking details and send confirmation emails via API
    // Don't block redirect if email fails - send in background
    console.log(
      `📧 [CCAVENUE CALLBACK] Payment successful! Triggering email via API for Booking #${bookingId}`
    );
    console.log(
      `📧 [CCAVENUE CALLBACK] Amount: ${paymentAmount} ${currency}, Transaction ID: ${trackingId || orderId}`
    );
    
    // Call email API endpoint (non-blocking - fire and forget)
    sendBookingEmailsViaAPI(
      bookingId,
      paymentAmount,
      currency,
      paymentType,
      trackingId || orderId,
      req.nextUrl.origin
    ).catch(emailError => {
      // Log error but don't block the user redirect
      console.error(
        `❌ [CCAVENUE CALLBACK] Failed to trigger email API for Booking #${bookingId}:`,
        emailError
      );
    });

    // Redirect to thank you page
    return NextResponse.redirect(
      new URL(`/thank-you?bookingId=${bookingId}`, req.nextUrl.origin)
    );
  } catch (error: any) {
    return NextResponse.redirect(
      new URL('/checkout?error=payment_processing_failed', req.nextUrl.origin)
    );
  }
}

// Helper function to call email API endpoint (non-blocking)
async function sendBookingEmailsViaAPI(
  bookingId: string,
  paymentAmount: number,
  currency: string,
  paymentType: string,
  transactionId: string,
  origin: string
) {
  console.log(`📧 [EMAIL API] Calling email API for Booking #${bookingId}`);
  
  try {
    // Fetch booking details first
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error(
        `❌ [EMAIL API] Failed to fetch booking:`,
        bookingError
      );
      return;
    }

    // Get passenger data
    const passengers = Array.isArray(booking.passengers)
      ? booking.passengers
      : [];
    const leadPassenger = passengers[0] || {};

    // Get customer info from lead passenger
    const customerName =
      `${leadPassenger.firstName || ''} ${leadPassenger.lastName || ''}`.trim();
    const customerEmail = leadPassenger.email || '';
    const customerPhone = leadPassenger.phone || '';
    const customerWhatsApp = leadPassenger.whatsapp || '';

    if (!customerEmail) {
      console.error(
        `❌ [EMAIL API] No customer email found in booking #${bookingId}`
      );
      return;
    }

    // Fetch package details
    const packageIds = Array.isArray(booking.package_ids)
      ? booking.package_ids
      : [];
    const cartItems = Array.isArray(booking.cart_items)
      ? booking.cart_items
      : [];

    const packageDetails = await Promise.all(
      packageIds.map(async (packageId: string) => {
        const { data: pkg } = await supabaseAdmin
          .from('packages')
          .select('package_name, package_id')
          .eq('package_id', packageId)
          .single();

        return {
          packageId,
          packageName: pkg?.package_name || 'Unknown Package',
        };
      })
    );

    const packages = cartItems.map((item: any) => {
      const pkgDetail = packageDetails.find(
        p => p.packageId === item.packageId
      );
      return {
        packageName: pkgDetail?.packageName || 'Unknown Package',
        packageId: item.packageId || '',
        selectedDate: item.selectedDate || null,
        adults: item.adults || 0,
        children: item.children || 0,
        infants: item.infants || 0,
        price: item.price || 0,
      };
    });

    // Prepare email data for API
    const emailData = {
      bookingId: booking.id,
      customerName: customerName || 'Valued Customer',
      customerEmail,
      customerPhone,
      customerWhatsApp,
      bookingDate: booking.created_at || new Date().toISOString(),
      packages,
      totalAmount: booking.total_amount || 0,
      paymentAmount,
      paymentCurrency: currency,
      paymentType,
      paymentStatus: booking.payment_status || 'completed',
      paymentTransactionId: transactionId,
      paymentGateway: booking.payment_gateway || 'ccavenue',
      passengers: passengers.map((p: any) => ({
        salutation: p.salutation || '',
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        email: p.email || '',
        phone: p.phone || '',
        whatsapp: p.whatsapp || '',
        country: p.country || '',
        pickupLocation: p.pickupLocation || undefined,
        permanentAddress: p.permanentAddress || '',
        passportExpiry: p.passportExpiry || '',
        nationality: p.nationality || undefined,
      })),
    };

    // Call email API endpoint
    const emailApiUrl = `${origin}/api/email/send-booking-confirmation`;
    console.log(`📧 [EMAIL API] Calling: ${emailApiUrl}`);
    
    const response = await fetch(emailApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(
        `✅ [EMAIL API] Booking confirmation emails sent successfully for Booking #${bookingId}`
      );
      console.log(`✅ [EMAIL API] Customer Email ID: ${result.customerEmailId}`);
      console.log(`✅ [EMAIL API] Internal Email ID: ${result.internalEmailId}`);
    } else {
      console.error(
        `❌ [EMAIL API] Failed to send emails for Booking #${bookingId}:`,
        result.error
      );
    }
  } catch (error) {
    console.error(
      `❌ [EMAIL API] Unexpected error for Booking #${bookingId}:`,
      error
    );
    // Don't throw - we don't want to block the payment flow
  }
}
