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
        new URL('/checkout?error=payment_failed', req.nextUrl.origin),
        { status: 302 }
      );
    }

    // Using working key directly (matching create-order)
    const workingKey = '5E25D58B6BF1633A1525984EB4E2E944';

    // Fallback to env if needed (for production)
    // const workingKey = process.env.CCAVENUE_WORKING_KEY || '5E25D58B6BF1633A1525984EB4E2E944';

    if (!workingKey) {
      return NextResponse.redirect(
        new URL('/checkout?error=payment_processing_failed', req.nextUrl.origin),
        { status: 302 }
      );
    }

    // Use the guide's method to decrypt and parse response
    const data = redirectResponseToJson(encryptedResponse, workingKey);

    const orderStatus = data.order_status;
    const orderId = data.order_id;
    const amount = data.amount;
    const currency = data.currency || 'AED';
    const bookingId = data.merchant_param1 || '';
    const paymentType = data.merchant_param2 || 'full';
    const trackingId = data.tracking_id || '';

    if (orderStatus !== 'Success') {
      // Oman visa: by paymentType or by order ID prefix (OV) from CRM
      const isOmanVisa =
        paymentType === 'oman_visa' ||
        (bookingId && bookingId.toUpperCase().startsWith('OV'));
      if (isOmanVisa) {
        return NextResponse.redirect(
          new URL('/visas/apply-for-oman-visa?error=payment_failed', req.nextUrl.origin),
          { status: 302 }
        );
      }
      return NextResponse.redirect(
        new URL(
          `/checkout?error=payment_failed&bookingId=${bookingId}`,
          req.nextUrl.origin
        ),
        { status: 302 }
      );
    }

    // Oman visa payment success – complete via CRM, send emails, redirect to thank you
    if (paymentType === 'oman_visa') {
      const paymentAmount = parseFloat(amount || '0');
      const apiKey = process.env.WEBSITE_API_KEY?.trim();
      const crmBase = process.env.CRM_API_URL || 'https://crm.aapkatourism.com';
      const completeUrl = `${crmBase.replace(/\/$/, '')}/api/website/oman-visa-enquiry/complete-payment`;

      try {
        const completeRes = await fetch(completeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey || '',
          },
          body: JSON.stringify({
            order_id: orderId,
            payment_transaction_id: trackingId || orderId,
            payment_amount: paymentAmount,
            payment_currency: currency,
          }),
        });

        const completeData = await completeRes.json();

        if (!completeRes.ok || !completeData.success) {
          console.error('Oman visa complete-payment failed:', completeData);
          return NextResponse.redirect(
            new URL('/visas/apply-for-oman-visa?error=payment_save_failed', req.nextUrl.origin),
            { status: 302 }
          );
        }

        // Send emails in background
        const emailApiUrl = `${req.nextUrl.origin}/api/email/oman-visa-confirmation`;
        fetch(emailApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: completeData.name,
            email: completeData.email,
            contact: completeData.contact || '',
          }),
        }).catch((e) => console.error('Oman visa email error:', e));

        return NextResponse.redirect(
          new URL('/visas/apply-for-oman-visa/thank-you', req.nextUrl.origin),
          { status: 302 }
        );
      } catch (omanErr: unknown) {
        console.error('Oman visa callback error:', omanErr);
        return NextResponse.redirect(
          new URL('/visas/apply-for-oman-visa?error=payment_processing_failed', req.nextUrl.origin),
          { status: 302 }
        );
      }
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
        ),
        { status: 302 }
      );
    }

    // Create influencer referral conversion (when customer paid via influencer link)
    try {
      const { data: bookingForInfluencer } = await supabaseAdmin
        .from('bookings')
        .select('influencer_referral_code, payment_amount, payment_amount_currency')
        .eq('id', bookingId)
        .single();

      if (bookingForInfluencer?.influencer_referral_code) {
        const refCode = bookingForInfluencer.influencer_referral_code;
        const paymentAmt = parseFloat(bookingForInfluencer.payment_amount || String(paymentAmount)) || paymentAmount;

        const { data: link } = await supabaseAdmin
          .from('influencer_referral_links')
          .select('id, influencer_id, entity_id')
          .eq('referral_code', refCode)
          .single();

        if (link) {
          const { data: commission } = await supabaseAdmin
            .from('referral_commissions')
            .select('commission_percent')
            .eq('entity_type', 'package')
            .eq('entity_id', link.entity_id)
            .eq('is_active', true)
            .single();

          const commissionPercent = parseFloat(commission?.commission_percent || '0') || 0;
          const commissionAmount = (paymentAmt * commissionPercent) / 100;

          await supabaseAdmin.from('referral_conversions').insert({
            referral_code: refCode,
            influencer_id: link.influencer_id,
            booking_id: bookingId,
            payment_amount: paymentAmt,
            commission_percent: commissionPercent,
            commission_amount: commissionAmount,
            status: 'pending',
          });
        }
      }
    } catch (influencerErr) {
      console.error('[INFLUENCER] Error creating conversion:', influencerErr);
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
    return NextResponse.redirect(new URL('/thank-you', req.nextUrl.origin), {
      status: 302,
    });
  } catch (error: any) {
    return NextResponse.redirect(
      new URL('/checkout?error=payment_processing_failed', req.nextUrl.origin),
      { status: 302 }
    );
  }
}
