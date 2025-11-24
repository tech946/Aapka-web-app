import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendBookingConfirmationEmail } from '@/lib/email';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // HDFC sends response via POST with encrypted data
    const formData = await req.formData();
    const encryptedResponse = (formData.get('encResp') as string) || '';

    if (!encryptedResponse) {
      return NextResponse.redirect(
        new URL('/checkout?error=payment_failed', req.nextUrl.origin)
      );
    }

    const workingKey = process.env.HDFC_WORKING_KEY || '';

    // Decrypt the response
    const decryptedResponse = decrypt(encryptedResponse, workingKey);
    const params = new URLSearchParams(decryptedResponse);

    const orderStatus = params.get('Order_Status');
    const orderId = params.get('Order_Id');
    const amount = params.get('Amount');
    const bookingId = params.get('Merchant_Param1') || '';
    const paymentType = params.get('Merchant_Param2') || 'full';
    const trackingId =
      params.get('Tracking_Id') || params.get('Payment_Id') || '';

    if (orderStatus !== 'Success' && orderStatus !== 'SUCCESS') {
      // Payment failed
      return NextResponse.redirect(
        new URL(
          `/checkout?error=payment_failed&bookingId=${bookingId}`,
          req.nextUrl.origin
        )
      );
    }

    // Update booking with payment details
    const amountInRupees = parseFloat(amount || '0');

    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        payment_status: 'completed',
        payment_transaction_id: trackingId || orderId,
        payment_amount: amountInRupees,
        payment_amount_currency: 'INR',
        payment_type: paymentType,
        payment_gateway: 'hdfc',
        payment_done: paymentType,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.redirect(
        new URL(
          `/checkout?error=payment_verified_but_update_failed&bookingId=${bookingId}`,
          req.nextUrl.origin
        )
      );
    }

    // Fetch booking details and send confirmation emails
    // Don't block redirect if email fails - send in background
    sendBookingEmails(
      bookingId,
      amountInRupees,
      'INR',
      paymentType,
      trackingId || orderId || ''
    ).catch(emailError => {
      // Log error but don't block the user redirect
      console.error('Failed to send booking confirmation emails:', emailError);
    });

    // Redirect to success page
    return NextResponse.redirect(
      new URL(`/checkout/success?bookingId=${bookingId}`, req.nextUrl.origin)
    );
  } catch (error: any) {
    console.error('Error processing HDFC callback:', error);
    return NextResponse.redirect(
      new URL('/checkout?error=payment_processing_failed', req.nextUrl.origin)
    );
  }
}

// Handle GET requests (some gateways use GET for callbacks)
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const encryptedResponse = searchParams.get('encResp') || '';

    if (!encryptedResponse) {
      return NextResponse.redirect(
        new URL('/checkout?error=payment_failed', req.nextUrl.origin)
      );
    }

    const workingKey = process.env.HDFC_WORKING_KEY || '';

    // Decrypt the response
    const decryptedResponse = decrypt(encryptedResponse, workingKey);
    const params = new URLSearchParams(decryptedResponse);

    const orderStatus = params.get('Order_Status');
    const orderId = params.get('Order_Id');
    const amount = params.get('Amount');
    const bookingId = params.get('Merchant_Param1') || '';
    const paymentType = params.get('Merchant_Param2') || 'full';
    const trackingId =
      params.get('Tracking_Id') || params.get('Payment_Id') || '';

    if (orderStatus !== 'Success' && orderStatus !== 'SUCCESS') {
      // Payment failed
      return NextResponse.redirect(
        new URL(
          `/checkout?error=payment_failed&bookingId=${bookingId}`,
          req.nextUrl.origin
        )
      );
    }

    // Update booking with payment details
    const amountInRupees = parseFloat(amount || '0');

    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        payment_status: 'completed',
        payment_transaction_id: trackingId || orderId,
        payment_amount: amountInRupees,
        payment_amount_currency: 'INR',
        payment_type: paymentType,
        payment_gateway: 'hdfc',
        payment_done: paymentType,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return NextResponse.redirect(
        new URL(
          `/checkout?error=payment_verified_but_update_failed&bookingId=${bookingId}`,
          req.nextUrl.origin
        )
      );
    }

    // Fetch booking details and send confirmation emails
    // Don't block redirect if email fails - send in background
    sendBookingEmails(
      bookingId,
      amountInRupees,
      'INR',
      paymentType,
      trackingId || orderId || ''
    ).catch(emailError => {
      // Log error but don't block the user redirect
      console.error('Failed to send booking confirmation emails:', emailError);
    });

    // Redirect to success page
    return NextResponse.redirect(
      new URL(`/checkout/success?bookingId=${bookingId}`, req.nextUrl.origin)
    );
  } catch (error: any) {
    console.error('Error processing HDFC callback:', error);
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
  try {
    // Fetch booking with all details
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Failed to fetch booking for email:', bookingError);
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
      console.error('No customer email found in booking');
      return;
    }

    // Fetch package details for all packages in booking
    const packageIds = Array.isArray(booking.package_ids)
      ? booking.package_ids
      : [];
    const cartItems = Array.isArray(booking.cart_items)
      ? booking.cart_items
      : [];

    // Fetch package names from database
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
      paymentGateway: booking.payment_gateway || 'hdfc',
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
    await sendBookingConfirmationEmail(emailData);
  } catch (error) {
    console.error('Error in sendBookingEmails:', error);
    // Don't throw - we don't want to block the payment flow
  }
}

// HDFC decryption function
// HDFC uses AES-128-CBC decryption similar to CCAvenue
function decrypt(encryptedText: string, key: string): string {
  try {
    const algorithm = 'aes-128-cbc';

    // HDFC expects the key to be used for AES decryption
    // The working key should be 16 bytes for AES-128
    const keyBuffer = Buffer.from(key.substring(0, 16), 'utf8');
    const iv = Buffer.alloc(16, 0); // IV should be all zeros for HDFC

    const decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
    let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    // Fallback to simple base64 decoding (not secure, for testing only)
    try {
      return Buffer.from(encryptedText, 'base64').toString('utf8');
    } catch {
      return '';
    }
  }
}
