import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { redirectResponseToJson } from '@/lib/ccavenue-crypto';
import { sendBookingConfirmationEmail } from '@/lib/email';

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

    // Fetch booking details and send confirmation emails
    // Don't block redirect if email fails - send in background
    console.log(
      `📧 [CCAVENUE CALLBACK] Payment successful! Triggering email for Booking #${bookingId}`
    );
    console.log(
      `📧 [CCAVENUE CALLBACK] Amount: ${paymentAmount} ${currency}, Transaction ID: ${trackingId || orderId}`
    );
    sendBookingEmails(
      bookingId,
      paymentAmount,
      currency,
      paymentType,
      trackingId || orderId
    ).catch(emailError => {
      // Log error but don't block the user redirect
      console.error(
        `❌ [CCAVENUE CALLBACK] Failed to send booking confirmation emails for Booking #${bookingId}:`,
        emailError
      );
    });

    // Redirect to success page
    return NextResponse.redirect(
      new URL(`/checkout/success?bookingId=${bookingId}`, req.nextUrl.origin)
    );
  } catch (error: any) {
    return NextResponse.redirect(
      new URL('/checkout?error=payment_processing_failed', req.nextUrl.origin)
    );
  }
}

// Helper function to fetch booking details and send emails
async function sendBookingEmails(
  bookingId: string,
  paymentAmount: number,
  currency: string,
  paymentType: string,
  transactionId: string
) {
  console.log(`📧 [SEND EMAILS] Function called for Booking #${bookingId}`);
  console.log(`📧 [SEND EMAILS] Payment Amount: ${paymentAmount} ${currency}`);
  console.log(
    `📧 [SEND EMAILS] Payment Type: ${paymentType}, Transaction ID: ${transactionId}`
  );

  try {
    console.log(`📧 [SEND EMAILS] Fetching booking details from database...`);
    // Fetch booking with all details
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error(
        `❌ [SEND EMAILS] Failed to fetch booking for email:`,
        bookingError
      );
      console.error(`❌ [SEND EMAILS] Booking ID: ${bookingId}`);
      return;
    }

    console.log(`✅ [SEND EMAILS] Booking fetched successfully`);
    console.log(
      `📧 [SEND EMAILS] Booking status: ${booking.payment_status}, Gateway: ${booking.payment_gateway}`
    );

    // Get passenger data
    console.log(`📧 [SEND EMAILS] Extracting passenger data...`);
    const passengers = Array.isArray(booking.passengers)
      ? booking.passengers
      : [];
    console.log(`📧 [SEND EMAILS] Number of passengers: ${passengers.length}`);
    const leadPassenger = passengers[0] || {};

    // Get customer info from lead passenger
    const customerName =
      `${leadPassenger.firstName || ''} ${leadPassenger.lastName || ''}`.trim();
    const customerEmail = leadPassenger.email || '';
    const customerPhone = leadPassenger.phone || '';
    const customerWhatsApp = leadPassenger.whatsapp || '';

    console.log(`📧 [SEND EMAILS] Lead passenger: ${customerName}`);
    console.log(
      `📧 [SEND EMAILS] Customer email: ${customerEmail || 'NOT FOUND'}`
    );
    console.log(
      `📧 [SEND EMAILS] Customer phone: ${customerPhone || 'NOT FOUND'}`
    );

    if (!customerEmail) {
      console.error(
        `❌ [SEND EMAILS] No customer email found in booking #${bookingId}`
      );
      console.error(
        `❌ [SEND EMAILS] Cannot send email without customer email`
      );
      return;
    }

    // Fetch package details for all packages in booking
    console.log(`📧 [SEND EMAILS] Fetching package details...`);
    const packageIds = Array.isArray(booking.package_ids)
      ? booking.package_ids
      : [];
    const cartItems = Array.isArray(booking.cart_items)
      ? booking.cart_items
      : [];

    console.log(`📧 [SEND EMAILS] Package IDs: ${packageIds.join(', ')}`);
    console.log(`📧 [SEND EMAILS] Cart items count: ${cartItems.length}`);

    // Fetch package names from database
    console.log(`📧 [SEND EMAILS] Querying package names from database...`);
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

    // Map cart items with package names
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

    // Prepare email data
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

    // Send emails
    console.log(
      `📧 [SEND EMAILS] All data prepared, calling sendBookingConfirmationEmail...`
    );
    console.log(`📧 [SEND EMAILS] Email data summary:`, {
      bookingId: emailData.bookingId,
      customerName: emailData.customerName,
      customerEmail: emailData.customerEmail,
      packagesCount: emailData.packages.length,
      totalAmount: emailData.totalAmount,
      paymentAmount: emailData.paymentAmount,
    });

    const emailResult = await sendBookingConfirmationEmail(emailData);
    if (emailResult.success) {
      console.log(
        `✅ [SEND EMAILS] Booking confirmation email sent successfully for Booking #${emailData.bookingId}`
      );
      console.log(
        `✅ [SEND EMAILS] Resend Email ID: ${emailResult.internalEmailId}`
      );
    } else {
      console.error(
        `❌ [SEND EMAILS] Failed to send booking confirmation email for Booking #${emailData.bookingId}`
      );
      console.error(`❌ [SEND EMAILS] Error: ${emailResult.error}`);
    }
  } catch (error) {
    console.error(
      `❌ [SEND EMAILS] Unexpected error in sendBookingEmails for Booking #${bookingId}:`,
      error
    );
    console.error(
      `❌ [SEND EMAILS] Error stack:`,
      error instanceof Error ? error.stack : 'No stack trace'
    );
    // Don't throw - we don't want to block the payment flow
  }
}
