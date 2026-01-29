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
    console.log('📥 [AGENT CALLBACK] Received callback:', {
      method: req.method,
      url: req.nextUrl.toString(),
    });

    let encryptedResponse = '';

    if (req.method === 'POST') {
      try {
        const bodyText = await req.text();
        console.log('[AGENT CALLBACK] POST body (first 200 chars):', bodyText.substring(0, 200));
        
        const params = new URLSearchParams(bodyText);
        encryptedResponse = params.get('encResp') || '';

        if (!encryptedResponse && bodyText.includes('encResp=')) {
          const match = bodyText.match(/encResp=([^&]+)/);
          if (match) {
            encryptedResponse = decodeURIComponent(match[1]);
          }
        }
        
        console.log('[AGENT CALLBACK] Extracted encResp length:', encryptedResponse?.length || 0);
      } catch (e: any) {
        console.error('[AGENT CALLBACK] Error parsing POST data:', e);
      }
    } else {
      const searchParams = req.nextUrl.searchParams;
      encryptedResponse = searchParams.get('encResp') || '';
      console.log('[AGENT CALLBACK] GET encResp length:', encryptedResponse?.length || 0);
    }

    if (!encryptedResponse) {
      console.error('[AGENT CALLBACK] No encrypted response found');
      return NextResponse.redirect(
        new URL('/become-agent/subscribe?error=payment_failed&reason=no_response', req.nextUrl.origin),
        { status: 303 } // Use 303 See Other to force GET redirect
      );
    }

    const workingKey = '5E25D58B6BF1633A1525984EB4E2E944';

    if (!workingKey) {
      return NextResponse.redirect(
        new URL('/become-agent/subscribe?error=payment_processing_failed', req.nextUrl.origin),
        { status: 303 } // Use 303 See Other to force GET redirect
      );
    }

    // Decrypt and parse response
    let data: Record<string, string>;
    try {
      data = redirectResponseToJson(encryptedResponse, workingKey);
      console.log('[AGENT CALLBACK] Decrypted response data:', JSON.stringify(data, null, 2));
    } catch (decryptError: any) {
      console.error('[AGENT CALLBACK] Error decrypting response:', decryptError);
      console.error('[AGENT CALLBACK] Encrypted response length:', encryptedResponse?.length || 0);
      return NextResponse.redirect(
        new URL('/become-agent/subscribe?error=payment_processing_failed', req.nextUrl.origin),
        { status: 303 }
      );
    }

    const orderStatus = data.order_status;
    const orderId = data.order_id;
    const amount = data.amount;
    const currency = data.currency || 'AED';
    const paymentOrderId = data.merchant_param1 || '';
    const paymentType = data.merchant_param2 || 'agent_subscription';
    const encodedUserDetails = data.merchant_param3 || '';
    const trackingId = data.tracking_id || '';

    console.log('[AGENT CALLBACK] Payment details:', {
      orderStatus,
      orderId,
      amount,
      currency,
      paymentOrderId,
      paymentType,
      trackingId,
      hasUserDetails: !!encodedUserDetails,
    });

    // Check order status (case-insensitive to handle variations)
    const normalizedOrderStatus = orderStatus?.toLowerCase() || '';
    console.log('📊 [AGENT CALLBACK] Normalized order status:', normalizedOrderStatus);
    
    if (normalizedOrderStatus !== 'success') {
      // Payment failed - log the reason
      console.error('[AGENT CALLBACK] Payment failed. Order status:', orderStatus);
      console.error('[AGENT CALLBACK] Full response data:', JSON.stringify(data, null, 2));
      
      // Include the actual failure reason in the error
      const failureReason = data.failure_message || data.status_message || data.order_status || 'Unknown reason';
      return NextResponse.redirect(
        new URL(`/become-agent/subscribe?error=payment_failed&reason=${encodeURIComponent(failureReason)}`, req.nextUrl.origin),
        { status: 303 } // Use 303 See Other to force GET redirect
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
      if (!encodedUserDetails || encodedUserDetails.trim() === '') {
        console.error('[AGENT CALLBACK] Empty encodedUserDetails in merchant_param3');
        return NextResponse.redirect(
          new URL('/become-agent/subscribe?error=invalid_payment_data&reason=missing_user_data', req.nextUrl.origin),
          { status: 303 }
        );
      }
      
      console.log('[AGENT CALLBACK] Encoded user details length:', encodedUserDetails.length);
      const decoded = Buffer.from(encodedUserDetails, 'base64').toString('utf-8');
      console.log('[AGENT CALLBACK] Decoded user details:', decoded);
      userDetails = JSON.parse(decoded);
      console.log('[AGENT CALLBACK] Parsed user details:', userDetails);
    } catch (decodeError: any) {
      console.error('[AGENT CALLBACK] Error decoding user details:', decodeError);
      console.error('[AGENT CALLBACK] Encoded value received:', encodedUserDetails?.substring(0, 100));
      return NextResponse.redirect(
        new URL('/become-agent/subscribe?error=invalid_payment_data&reason=decode_failed', req.nextUrl.origin),
        { status: 303 } // Use 303 See Other to force GET redirect
      );
    }

    // Verify user details are present
    if (!userDetails.email || !userDetails.fullName || !userDetails.residentCountry || !userDetails.mobileNumber) {
      console.error('[AGENT CALLBACK] Missing user details in payment callback:', {
        hasEmail: !!userDetails.email,
        hasFullName: !!userDetails.fullName,
        hasResidentCountry: !!userDetails.residentCountry,
        hasMobileNumber: !!userDetails.mobileNumber,
        userDetails,
      });
      return NextResponse.redirect(
        new URL('/become-agent/subscribe?error=missing_user_data', req.nextUrl.origin),
        { status: 303 } // Use 303 See Other to force GET redirect
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
        new URL('/agent/login?error=already_registered&email=' + encodeURIComponent(userDetails.email), req.nextUrl.origin),
        { status: 303 } // Use 303 See Other to force GET redirect
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
      console.error('[AGENT CALLBACK] Error creating subscription:', subscriptionError);
      console.error('[AGENT CALLBACK] Subscription error details:', JSON.stringify(subscriptionError, null, 2));
      return NextResponse.redirect(
        new URL('/become-agent/subscribe?error=subscription_creation_failed', req.nextUrl.origin),
        { status: 303 } // Use 303 See Other to force GET redirect
      );
    }
    
    console.log('[AGENT CALLBACK] Subscription created successfully:', subscription.id);

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
      console.error('[AGENT CALLBACK] Error creating user account:', authError);
      console.error('[AGENT CALLBACK] Auth error details:', JSON.stringify(authError, null, 2));
      // Rollback subscription if user creation fails
      await supabaseAdmin
        .from('subscriptions')
        .delete()
        .eq('id', subscription.id);

      return NextResponse.redirect(
        new URL('/become-agent/subscribe?error=user_creation_failed', req.nextUrl.origin),
        { status: 303 } // Use 303 See Other to force GET redirect
      );
    }

    const userId = authData.user.id;
    console.log('[AGENT CALLBACK] User account created successfully:', userId);

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
      console.error('[AGENT CALLBACK] Error creating agent:', agentError);
      console.error('[AGENT CALLBACK] Agent error details:', JSON.stringify(agentError, null, 2));
      // Rollback subscription and user if agent creation fails
      await supabaseAdmin
        .from('subscriptions')
        .delete()
        .eq('id', subscription.id);
      
      // Note: We can't easily delete the user account, but subscription is cleaned up
      return NextResponse.redirect(
        new URL('/become-agent/subscribe?error=agent_creation_failed', req.nextUrl.origin),
        { status: 303 } // Use 303 See Other to force GET redirect
      );
    }

    console.log('[AGENT CALLBACK] Agent created successfully:', agent.id);
    console.log('[AGENT CALLBACK] All records created successfully. Redirecting to login...');

    // Redirect to login page with success message
    return NextResponse.redirect(
      new URL('/agent/login?success=subscription_completed&email=' + encodeURIComponent(userDetails.email), req.nextUrl.origin),
      { status: 303 } // Use 303 See Other to force GET redirect
    );
  } catch (error: any) {
    console.error('Error processing agent subscription callback:', error);
    return NextResponse.redirect(
      new URL('/become-agent/subscribe?error=payment_processing_failed', req.nextUrl.origin),
      { status: 303 } // Use 303 See Other to force GET redirect
    );
  }
}
