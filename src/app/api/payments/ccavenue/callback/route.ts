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

    // Approve commissions for this booking (if referral exists and discount was not applied)
    try {
      const { data: booking } = await supabaseAdmin
        .from('bookings')
        .select('referral_id, total_amount, payment_amount_currency')
        .eq('id', bookingId)
        .single();

      if (booking?.referral_id) {
        // Check if referral had discount applied
        const { data: referral } = await supabaseAdmin
          .from('agent_referrals')
          .select('id, discount_applied, agent_id')
          .eq('id', booking.referral_id)
          .single();

        // Only approve commission if discount was NOT applied
        if (referral && !referral.discount_applied) {
          // Update commission status to approved
          const { data: commissions } = await supabaseAdmin
            .from('agent_commissions')
            .select('id, amount, currency')
            .eq('booking_id', bookingId)
            .eq('status', 'pending');

          if (commissions && commissions.length > 0) {
            for (const commission of commissions) {
              // Update commission status
              await supabaseAdmin
                .from('agent_commissions')
                .update({
                  status: 'approved',
                  approved_at: new Date().toISOString(),
                })
                .eq('id', commission.id);

              // Move wallet balance from pending to available
              await supabaseAdmin
                .from('agent_wallet')
                .update({
                  balance_type: 'available',
                })
                .eq('commission_id', commission.id)
                .eq('balance_type', 'pending');

              // Update referral status
              await supabaseAdmin
                .from('agent_referrals')
                .update({ status: 'completed' })
                .eq('id', booking.referral_id);
            }
          }
        }
      }
    } catch (commissionError) {
      // Log error but don't fail payment callback
      console.error('[COMMISSION] Error approving commission:', commissionError);
    }

    // Fetch booking details and send confirmation emails
    // Don't block redirect if email fails - send in background
    console.log(
      `📧 [CCAVENUE CALLBACK] Payment successful! Triggering email for Booking #${bookingId}`
    );
    console.log(
      `📧 [CCAVENUE CALLBACK] Amount: ${paymentAmount} ${currency}, Transaction ID: ${trackingId || orderId}`
    );

    // Send emails via API (non-blocking - fire and forget)
    const transactionId = trackingId || orderId;
    const emailApiUrl = `${req.nextUrl.origin}/api/email/send-booking-confirmation`;

    // Call email API in background (don't await - fire and forget)
    fetch(emailApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentTransactionId: transactionId,
      }),
    }).catch(emailError => {
      // Log error but don't block the user redirect
      console.error(
        `❌ [CCAVENUE CALLBACK] Failed to trigger email API for Transaction ID: ${transactionId}:`,
        emailError
      );
    });

    // Redirect to thank you page (no params needed)
    return NextResponse.redirect(new URL('/thank-you', req.nextUrl.origin));
  } catch (error: any) {
    return NextResponse.redirect(
      new URL('/checkout?error=payment_processing_failed', req.nextUrl.origin)
    );
  }
}
