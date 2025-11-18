import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { decrypt } from '@/lib/ccavenue-crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Handle both GET and POST requests (CCAvenue typically uses POST)
export async function GET(req: NextRequest) {
  return handleCallback(req);
}

export async function POST(req: NextRequest) {
  return handleCallback(req);
}

async function handleCallback(req: NextRequest) {
  try {
    let encryptedResponse = '';

    // CCAvenue sends response as POST data with encResp parameter
    // But also check GET params for compatibility
    if (req.method === 'POST') {
      // Read body as text and parse as URL-encoded form data
      try {
        const body = await req.text();
        const params = new URLSearchParams(body);
        encryptedResponse = params.get('encResp') || '';
      } catch (e) {
        console.error('Error parsing POST data:', e);
      }
    } else {
      // GET request - check query params
      const searchParams = req.nextUrl.searchParams;
      encryptedResponse = searchParams.get('encResp') || '';
    }

    if (!encryptedResponse) {
      return NextResponse.redirect(
        new URL('/checkout?error=payment_failed', req.nextUrl.origin)
      );
    }

    const workingKey = process.env.CCAVENUE_WORKING_KEY || '';

    // Decrypt the response using official CCAvenue method
    const decryptedResponse = decrypt(encryptedResponse, workingKey);
    const params = new URLSearchParams(decryptedResponse);

    const orderStatus = params.get('order_status');
    const orderId = params.get('order_id');
    const amount = params.get('amount');
    const bookingId = params.get('merchant_param1') || '';
    const paymentType = params.get('merchant_param2') || 'full';
    const trackingId = params.get('tracking_id') || '';

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
    const amountInRupees = parseFloat(amount || '0');

    const { error: updateError } = await supabaseAdmin
      .from('bookings')
      .update({
        payment_status: 'completed',
        payment_transaction_id: trackingId || orderId,
        payment_amount: amountInRupees,
        payment_amount_currency: 'INR',
        payment_type: paymentType,
        payment_gateway: 'ccavenue',
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

    // Redirect to success page
    return NextResponse.redirect(
      new URL(`/checkout/success?bookingId=${bookingId}`, req.nextUrl.origin)
    );
  } catch (error: any) {
    console.error('Error processing CCAvenue callback:', error);
    return NextResponse.redirect(
      new URL('/checkout?error=payment_processing_failed', req.nextUrl.origin)
    );
  }
}
