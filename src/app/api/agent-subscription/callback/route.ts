import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { redirectResponseToJson } from '@/lib/ccavenue-crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Handle POST requests
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

    if (req.method === 'POST') {
      try {
        const bodyText = await req.text();
        const params = new URLSearchParams(bodyText);
        encryptedResponse = params.get('encResp') || '';

        if (!encryptedResponse && bodyText.includes('encResp=')) {
          const match = bodyText.match(/encResp=([^&]+)/);
          if (match) {
            encryptedResponse = decodeURIComponent(match[1]);
          }
        }
      } catch (e) {
        // Error parsing POST data
      }
    } else {
      const searchParams = req.nextUrl.searchParams;
      encryptedResponse = searchParams.get('encResp') || '';
    }

    if (!encryptedResponse) {
      return NextResponse.redirect(
        new URL('/become-agent/subscribe?error=payment_failed', req.nextUrl.origin)
      );
    }

    const workingKey = '5E25D58B6BF1633A1525984EB4E2E944';

    if (!workingKey) {
      return NextResponse.redirect(
        new URL('/become-agent/subscribe?error=payment_processing_failed', req.nextUrl.origin)
      );
    }

    // Decrypt and parse response
    const data = redirectResponseToJson(encryptedResponse, workingKey);

    const orderStatus = data.order_status;
    const orderId = data.order_id;
    const amount = data.amount;
    const currency = data.currency || 'AED';
    const subscriptionId = data.merchant_param1 || '';
    const paymentType = data.merchant_param2 || 'agent_subscription';
    const agentId = data.merchant_param3 || '';
    const trackingId = data.tracking_id || '';

    if (orderStatus !== 'Success') {
      // Payment failed - delete pending records
      if (subscriptionId) {
        await supabaseAdmin
          .from('subscriptions')
          .delete()
          .eq('id', subscriptionId);
      }
      if (agentId) {
        await supabaseAdmin
          .from('agents')
          .delete()
          .eq('id', agentId);
      }

      return NextResponse.redirect(
        new URL('/become-agent/subscribe?error=payment_failed', req.nextUrl.origin)
      );
    }

    // Payment successful - update subscription and create user account
    const paymentAmount = parseFloat(amount || '0');

    // Get agent details
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.redirect(
        new URL('/become-agent/subscribe?error=agent_not_found', req.nextUrl.origin)
      );
    }

    // Create user account in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: agent.email,
      email_confirm: true, // Auto-confirm email
      password: `temp_${Date.now()}`, // Temporary password - user will need to reset
      user_metadata: {
        full_name: agent.full_name,
        phone: agent.mobile_number,
      },
    });

    if (authError || !authData.user) {
      console.error('Error creating user account:', authError);
      // Still update subscription but mark for manual user creation
      await supabaseAdmin
        .from('subscriptions')
        .update({
          payment_status: 'completed',
          payment_transaction_id: trackingId || orderId,
          payment_amount: paymentAmount,
          payment_gateway: 'ccavenue',
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscriptionId);

      await supabaseAdmin
        .from('agents')
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agentId);

      return NextResponse.redirect(
        new URL('/agent/login?error=user_creation_failed&payment=success', req.nextUrl.origin)
      );
    }

    const userId = authData.user.id;

    // Create user profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email_address: agent.email,
        full_name: agent.full_name,
        account_details: {
          phone: agent.mobile_number,
          country: agent.resident_country,
        },
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Continue anyway - profile might already exist
    }

    // Update subscription with user_id and payment details
    const { error: subscriptionUpdateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        user_id: userId,
        payment_status: 'completed',
        payment_transaction_id: trackingId || orderId,
        payment_amount: paymentAmount,
        payment_gateway: 'ccavenue',
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (subscriptionUpdateError) {
      console.error('Error updating subscription:', subscriptionUpdateError);
      return NextResponse.redirect(
        new URL('/become-agent/subscribe?error=subscription_update_failed', req.nextUrl.origin)
      );
    }

    // Update agent with user_id
    const { error: agentUpdateError } = await supabaseAdmin
      .from('agents')
      .update({
        user_id: userId,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', agentId);

    if (agentUpdateError) {
      console.error('Error updating agent:', agentUpdateError);
      // Non-critical error, continue
    }

    // Redirect to login page with success message
    return NextResponse.redirect(
      new URL('/agent/login?success=subscription_completed&email=' + encodeURIComponent(agent.email), req.nextUrl.origin)
    );
  } catch (error: any) {
    console.error('Error processing agent subscription callback:', error);
    return NextResponse.redirect(
      new URL('/become-agent/subscribe?error=payment_processing_failed', req.nextUrl.origin)
    );
  }
}
