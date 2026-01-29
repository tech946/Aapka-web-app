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
      
      // Try to get user_id from merchant params to clean up
      try {
        if (encodedUserDetails) {
          const decoded = Buffer.from(encodedUserDetails, 'base64').toString('utf-8');
          const userDetails = JSON.parse(decoded);
          if (userDetails.userId && typeof userDetails.userId === 'string') {
            const userIdToCleanup = userDetails.userId;
            // Delete the pending user account since payment failed
            console.log('[AGENT CALLBACK] Cleaning up pending user account:', userIdToCleanup);
            await supabaseAdmin.auth.admin.deleteUser(userIdToCleanup);
            // Also delete profile
            await supabaseAdmin.from('profiles').delete().eq('id', userIdToCleanup);
          }
        }
      } catch (cleanupError) {
        console.error('[AGENT CALLBACK] Error during cleanup:', cleanupError);
        // Continue with redirect even if cleanup fails
      }
      
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
      userId: string; // User ID from pre-created account
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
    if (!userDetails.userId || !userDetails.email || !userDetails.fullName || !userDetails.residentCountry || !userDetails.mobileNumber) {
      console.error('[AGENT CALLBACK] Missing user details in payment callback:', {
        hasUserId: !!userDetails.userId,
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

    const userId = userDetails.userId;

    // Verify the user account exists
    const { data: existingUser, error: userCheckError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userCheckError || !existingUser?.user) {
      console.error('[AGENT CALLBACK] User account not found:', userId, userCheckError);
      return NextResponse.redirect(
        new URL('/become-agent/subscribe?error=user_account_not_found', req.nextUrl.origin),
        { status: 303 }
      );
    }

    // Check if agent already exists (double-check in case of duplicate payment)
    const { data: existingAgent } = await supabaseAdmin
      .from('agents')
      .select('id, user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (existingAgent) {
      // Agent already exists - redirect to login
      console.log('[AGENT CALLBACK] Agent already exists for user:', userId);
      return NextResponse.redirect(
        new URL('/agent/login?error=already_registered&email=' + encodeURIComponent(userDetails.email), req.nextUrl.origin),
        { status: 303 } // Use 303 See Other to force GET redirect
      );
    }

    // Activate the user account (confirm email and update status)
    console.log('[AGENT CALLBACK] Activating user account:', userId);
    const { error: activateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true, // Confirm email
      user_metadata: {
        ...existingUser.user.user_metadata,
        account_status: 'active', // Update status from pending_payment to active
      },
    });

    if (activateError) {
      console.error('[AGENT CALLBACK] Error activating user account:', activateError);
      // Continue anyway - user can still login
    }

    // Update profile (only update fields that exist in the schema)
    // Note: account_details column may not exist, so we'll just update basic fields
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({
        email_address: userDetails.email,
        full_name: userDetails.fullName,
        // Only update account_details if column exists (will be ignored if it doesn't)
        // account_details: {
        //   phone: userDetails.mobileNumber,
        //   country: userDetails.residentCountry,
        //   status: 'active',
        // },
      })
      .eq('id', userId);

    if (profileUpdateError) {
      console.error('[AGENT CALLBACK] Error updating profile:', profileUpdateError);
      // Continue anyway - profile exists
    }

    // NOW create subscription record with completed status
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // 1 year from now

    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: userId, // Link to existing user
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
      // Rollback: deactivate user account
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          account_status: 'payment_failed',
        },
      });
      return NextResponse.redirect(
        new URL('/become-agent/subscribe?error=subscription_creation_failed', req.nextUrl.origin),
        { status: 303 } // Use 303 See Other to force GET redirect
      );
    }
    
    console.log('[AGENT CALLBACK] Subscription created successfully:', subscription.id);


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
      // Rollback subscription and deactivate user if agent creation fails
      await supabaseAdmin
        .from('subscriptions')
        .delete()
        .eq('id', subscription.id);
      
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          account_status: 'agent_creation_failed',
        },
      });
      
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
