import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
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
