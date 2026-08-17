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
        new URL(
          '/checkout?error=payment_processing_failed',
          req.nextUrl.origin
        ),
        { status: 302 }
      );
    }

    // Use the guide's method to decrypt and parse response
    const data = redirectResponseToJson(encryptedResponse, workingKey);

    // CCAvenue may return different key casings (order_id, Order_Id, order_status, etc.)
    const get = (keys: string[]) => {
      for (const k of keys) {
        const v = data[k];
        if (v != null && String(v).trim()) return String(v).trim();
      }
      return '';
    };
    const orderStatus = get(['order_status', 'Order_Status']) || '';
    const orderId = get(['order_id', 'Order_Id']);
    const amount = get(['amount', 'Amount']) || '';
    const currency = get(['currency', 'Currency']) || 'AED';
    const bookingId = get(['merchant_param1', 'Merchant_Param1']);
    const paymentType = get(['merchant_param2', 'Merchant_Param2']) || 'full';
    const trackingId = get(['tracking_id', 'Tracking_Id']);

    console.log('[CCAVENUE] Parsed response:', {
      orderStatus,
      orderId: orderId || '(empty)',
      bookingId: bookingId || '(empty)',
      paymentType,
      isOmanStyle: (orderId || bookingId).toUpperCase().startsWith('OV'),
    });

    const isSuccess = orderStatus.toLowerCase() === 'success';
    if (!isSuccess) {
      console.warn('[CCAVENUE] Payment not successful:', {
        order_status: orderStatus,
        failure_message: data.failure_message,
        status_message: data.status_message,
      });
      // Oman visa: by paymentType or by order ID prefix (OV) from CRM
      const isOmanVisa =
        paymentType === 'oman_visa' ||
        (bookingId && bookingId.toUpperCase().startsWith('OV'));
      if (isOmanVisa) {
        return NextResponse.redirect(
          new URL(
            '/visas/apply-for-oman-visa?error=payment_failed',
            req.nextUrl.origin
          ),
          { status: 302 }
        );
      }

      const failureCode = orderStatus || 'Unknown';
      const isAborted = failureCode.toLowerCase() === 'aborted';

      if (bookingId) {
        try {
          const failureReason =
            get(['failure_message', 'Failure_Message']) ||
            get(['status_message', 'Status_Message']) ||
            (isAborted
              ? 'Cancelled by customer at the payment gateway'
              : 'Payment was not completed');

          const AUDIT_FIELDS = [
            'order_status',
            'status_code',
            'status_message',
            'failure_message',
            'order_id',
            'tracking_id',
            'bank_ref_no',
            'payment_mode',
            'currency',
            'amount',
            'trans_date',
            'response_code',
          ];
          const gatewayResponse: Record<string, string> = {};
          for (const key of AUDIT_FIELDS) {
            const value = get([
              key,
              key.replace(/(^|_)([a-z])/g, (_m, p, c) => p + c.toUpperCase()),
            ]);
            if (value) gatewayResponse[key] = value;
          }

          // .eq('payment_status', 'pending') makes this a no-op on a booking
          // that already completed, so a late or duplicated failure callback
          // can never downgrade a paid booking.
          const { data: updatedRows, error: failureUpdateError } =
            await supabaseAdmin
              .from('bookings')
              .update({
                payment_status: isAborted ? 'cancelled' : 'failed',
                payment_failure_reason: failureReason,
                payment_failure_code: failureCode,
                payment_failed_at: new Date().toISOString(),
                payment_gateway_response: gatewayResponse,
                updated_at: new Date().toISOString(),
              })
              .eq('id', bookingId)
              .eq('payment_status', 'pending')
              .select('id');

          if (failureUpdateError) {
            console.error(
              '[CCAVENUE] Could not record payment failure:',
              failureUpdateError.message
            );
          } else if (updatedRows && updatedRows.length > 0) {
            console.log(
              `[CCAVENUE] Recorded ${isAborted ? 'cancellation' : 'failure'} for booking ${bookingId}: ${failureReason}`
            );
          } else {
            // Guard did its job: the booking was no longer pending, so this is
            // a late or duplicate callback for a payment already resolved.
            console.log(
              `[CCAVENUE] No update for booking ${bookingId} - it is no longer pending (late or duplicate callback)`
            );
          }
        } catch (recordError) {
          console.error(
            '[CCAVENUE] Could not record payment failure:',
            recordError
          );
        }
      }

      return NextResponse.redirect(
        new URL(
          `/checkout?error=${isAborted ? 'payment_cancelled' : 'payment_failed'}&bookingId=${bookingId}`,
          req.nextUrl.origin
        ),
        { status: 302 }
      );
    }

    // Oman visa payment success – complete via CRM, send emails, redirect to thank you
    // Use paymentType, OV prefix from merchant_param1, or order_id (merchant_param2 can be lost in CCAvenue)
    const ovId = (orderId || bookingId || '').toString().toUpperCase();
    const isOmanVisaSuccess =
      paymentType === 'oman_visa' || ovId.startsWith('OV');
    if (isOmanVisaSuccess) {
      const paymentAmount = parseFloat(amount || '0');
      const apiKey = process.env.WEBSITE_API_KEY?.trim();
      const crmBase = process.env.CRM_API_URL || 'https://crm.aapkatourism.com';
      const completeUrl = `${crmBase.replace(/\/$/, '')}/api/website/oman-visa-enquiry/complete-payment`;
      // Use order_id from CCAvenue response; fallback to merchant_param1 (we set both to OV... for Oman visa)
      const orderIdForCrm = orderId || bookingId || '';

      if (!orderIdForCrm) {
        console.error(
          '[OMAN VISA] Missing order_id and merchant_param1 in CCAvenue response. Raw keys:',
          Object.keys(data)
        );
        return NextResponse.redirect(
          new URL(
            '/visas/apply-for-oman-visa?error=payment_save_failed',
            req.nextUrl.origin
          ),
          { status: 302 }
        );
      }

      if (!apiKey) {
        console.error('[OMAN VISA] WEBSITE_API_KEY not configured');
        return NextResponse.redirect(
          new URL(
            '/visas/apply-for-oman-visa?error=payment_save_failed',
            req.nextUrl.origin
          ),
          { status: 302 }
        );
      }

      try {
        const completePayload = {
          order_id: orderIdForCrm,
          payment_transaction_id: trackingId || orderIdForCrm,
          payment_amount: paymentAmount,
          payment_currency: currency,
        };
        console.log('[OMAN VISA] Calling complete-payment:', {
          order_id: orderIdForCrm,
          url: completeUrl,
        });

        const completeRes = await fetch(completeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey || '',
          },
          body: JSON.stringify(completePayload),
        });

        const responseText = await completeRes.text();
        let completeData: {
          success?: boolean;
          name?: string;
          email?: string;
          contact?: string;
          error?: string;
        } = {};
        try {
          completeData = responseText ? JSON.parse(responseText) : {};
        } catch {
          console.error(
            '[OMAN VISA] complete-payment returned non-JSON:',
            responseText?.substring(0, 300)
          );
        }

        if (!completeRes.ok || !completeData.success) {
          console.error('Oman visa complete-payment failed:', {
            status: completeRes.status,
            completeData,
            orderIdForCrm,
          });
          return NextResponse.redirect(
            new URL(
              '/visas/apply-for-oman-visa?error=payment_save_failed',
              req.nextUrl.origin
            ),
            { status: 302 }
          );
        }

        // Await email so it is sent before redirect (fire-and-forget can get cancelled)
        const emailApiUrl = `${req.nextUrl.origin}/api/email/oman-visa-confirmation`;
        try {
          const emailRes = await fetch(emailApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: completeData.name,
              email: completeData.email,
              contact: completeData.contact || '',
            }),
          });
          if (!emailRes.ok) {
            const errText = await emailRes.text();
            console.error(
              'Oman visa email API error:',
              emailRes.status,
              errText
            );
          }
        } catch (emailErr) {
          console.error('Oman visa email error:', emailErr);
          // Still redirect – user has paid and record is saved
        }

        return NextResponse.redirect(
          new URL('/visas/apply-for-oman-visa/thank-you', req.nextUrl.origin),
          { status: 302 }
        );
      } catch (omanErr: unknown) {
        console.error('Oman visa callback error:', omanErr);
        return NextResponse.redirect(
          new URL(
            '/visas/apply-for-oman-visa?error=payment_processing_failed',
            req.nextUrl.origin
          ),
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
        .select(
          'influencer_referral_code, payment_amount, payment_amount_currency'
        )
        .eq('id', bookingId)
        .single();

      if (bookingForInfluencer?.influencer_referral_code) {
        const refCode = bookingForInfluencer.influencer_referral_code;
        const paymentAmt =
          parseFloat(
            bookingForInfluencer.payment_amount || String(paymentAmount)
          ) || paymentAmount;

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

          const commissionPercent =
            parseFloat(commission?.commission_percent || '0') || 0;
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
      console.error(
        '[COMMISSION] Error approving commission:',
        commissionError
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
