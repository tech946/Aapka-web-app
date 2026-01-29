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
    const paymentOrderId = data.merchant_param1 || '';
    const paymentType = data.merchant_param2 || 'agent_subscription';
    const encodedUserDetails = data.merchant_param3 || '';
    const trackingId = data.tracking_id || '';

    if (orderStatus !== 'Success') {
      // Payment failed - no records to clean up since we don't create them before payment
      return NextResponse.redirect(
        new URL('/become-agent/subscribe?error=payment_failed', req.nextUrl.origin)
      );
    }

    // Payment successful - NOW create all records
    const paymentAmount = parseFloat(amount || '0');

    // Decode user details from merchant param
    let userDetails: {
      email: string;
      fullName: string;
      residentCountry: string;
      mobileNumber: string;
    };

    try {
      const decoded = Buffer.from(encodedUserDetails, 'base64').toString('utf-8');
      userDetails = JSON.parse(decoded);
    } catch (decodeError) {
      console.error('Error decoding user details:', decodeError);
      return NextResponse.redirect(
        new URL('/become-agent/subscribe?error=invalid_payment_data', req.nextUrl.origin)
      );
    }

    // Verify user details are present
    if (!userDetails.email || !userDetails.fullName || !userDetails.residentCountry || !userDetails.mobileNumber) {
      console.error('Missing user details in payment callback');
      return NextResponse.redirect(
        new URL('/become-agent/subscribe?error=missing_user_data', req.nextUrl.origin)
      );
    }

    // Check if agent already exists (double-check in case of duplicate payment)
    const { data: existingAgent } = await supabaseAdmin
      .from('agents')
      .select('id, user_id')
      .eq('email', userDetails.email)
      .maybeSingle();

    if (existingAgent && existingAgent.user_id) {
      // Agent already exists and has account - redirect to login
      return NextResponse.redirect(
        new URL('/agent/login?error=already_registered&email=' + encodeURIComponent(userDetails.email), req.nextUrl.origin)
      );
    }

    // NOW create subscription record with completed status
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // 1 year from now

    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        subscription_type: 'agent_premium',
        amount_paid: paymentAmount,
        currency: currency,
        payment_status: 'completed', // Payment is already successful
        payment_transaction_id: trackingId || orderId,
        payment_gateway: 'ccavenue',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_active: true, // Active since payment is completed
      })
      .select()
      .single();

    if (subscriptionError || !subscription) {
      console.error('Error creating subscription:', subscriptionError);
      return NextResponse.redirect(
        new URL('/become-agent/subscribe?error=subscription_creation_failed', req.nextUrl.origin)
      );
    }

    // Create user account in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userDetails.email,
      email_confirm: true, // Auto-confirm email
      password: `temp_${Date.now()}`, // Temporary password - user will need to reset
      user_metadata: {
        full_name: userDetails.fullName,
        phone: userDetails.mobileNumber,
      },
    });

    if (authError || !authData.user) {
      console.error('Error creating user account:', authError);
      // Rollback subscription if user creation fails
      await supabaseAdmin
        .from('subscriptions')
        .delete()
        .eq('id', subscription.id);

      return NextResponse.redirect(
        new URL('/become-agent/subscribe?error=user_creation_failed', req.nextUrl.origin)
      );
    }

    const userId = authData.user.id;

    // Create user profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email_address: userDetails.email,
        full_name: userDetails.fullName,
        account_details: {
          phone: userDetails.mobileNumber,
          country: userDetails.residentCountry,
        },
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // Continue anyway - profile might already exist
    }

    // Update subscription with user_id
    const { error: subscriptionUpdateError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        user_id: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscription.id);

    if (subscriptionUpdateError) {
      console.error('Error updating subscription with user_id:', subscriptionUpdateError);
      // Non-critical, continue
    }

    // NOW create agent record with all details
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .insert({
        user_id: userId,
        email: userDetails.email,
        full_name: userDetails.fullName,
        resident_country: userDetails.residentCountry,
        mobile_number: userDetails.mobileNumber,
        subscription_id: subscription.id,
        is_active: true, // Active since payment is completed
      })
      .select()
      .single();

    if (agentError || !agent) {
      console.error('Error creating agent:', agentError);
      // Rollback subscription and user if agent creation fails
      await supabaseAdmin
        .from('subscriptions')
        .delete()
        .eq('id', subscription.id);
      
      // Note: We can't easily delete the user account, but subscription is cleaned up
      return NextResponse.redirect(
        new URL('/become-agent/subscribe?error=agent_creation_failed', req.nextUrl.origin)
      );
    }

    // Redirect to login page with success message
    return NextResponse.redirect(
      new URL('/agent/login?success=subscription_completed&email=' + encodeURIComponent(userDetails.email), req.nextUrl.origin)
    );
  } catch (error: any) {
    console.error('Error processing agent subscription callback:', error);
    return NextResponse.redirect(
      new URL('/become-agent/subscribe?error=payment_processing_failed', req.nextUrl.origin)
    );
  }
}
