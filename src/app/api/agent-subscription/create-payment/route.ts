import { NextRequest, NextResponse } from 'next/server';
import { encrypt } from '@/lib/ccavenue-crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CreateAgentSubscriptionPaymentRequest {
  email: string;
  fullName: string;
  residentCountry: string;
  mobileNumber: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateAgentSubscriptionPaymentRequest = await req.json();
    const { email, fullName, residentCountry, mobileNumber } = body;

    // Validation
    if (!email || !fullName || !residentCountry || !mobileNumber) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if agent already exists with this email
    const { data: existingAgent } = await supabaseAdmin
      .from('agents')
      .select('id')
      .eq('email', email)
      .single();

    if (existingAgent) {
      return NextResponse.json(
        { error: 'An agent with this email already exists' },
        { status: 400 }
      );
    }

    // Create subscription record with pending status
    const subscriptionAmount = 110.00;
    const currency = 'AED';
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // 1 year from now

    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        subscription_type: 'agent_premium',
        amount_paid: subscriptionAmount,
        currency: currency,
        payment_status: 'pending',
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        is_active: false,
      })
      .select()
      .single();

    if (subscriptionError || !subscription) {
      console.error('Error creating subscription:', subscriptionError);
      return NextResponse.json(
        { error: 'Failed to create subscription record' },
        { status: 500 }
      );
    }

    // Create temporary agent record (will be updated after payment)
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .insert({
        email: email,
        full_name: fullName,
        resident_country: residentCountry,
        mobile_number: mobileNumber,
        subscription_id: subscription.id,
        is_active: false, // Will be activated after payment
      })
      .select()
      .single();

    if (agentError || !agent) {
      // Rollback subscription if agent creation fails
      await supabaseAdmin
        .from('subscriptions')
        .delete()
        .eq('id', subscription.id);

      console.error('Error creating agent:', agentError);
      return NextResponse.json(
        { error: 'Failed to create agent record' },
        { status: 500 }
      );
    }

    // CCAvenue credentials
    const merchantId = '54983';
    const accessCode = 'AVLG05MJ58AS49GLSA';
    const workingKey = '5E25D58B6BF1633A1525984EB4E2E944';

    // Create order ID for agent subscription
    const subscriptionIdShort = subscription.id.slice(-12).replace(/-/g, '');
    const timestampShort = Date.now().toString().slice(-6);
    const orderId = `AG${subscriptionIdShort}${timestampShort}`.substring(0, 30);

    // Prepare payment parameters
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;

    const paymentParams: Record<string, string> = {
      merchant_id: merchantId,
      order_id: orderId,
      amount: subscriptionAmount.toFixed(2),
      currency: currency,
      redirect_url: `${baseUrl}/api/agent-subscription/callback`, // Separate callback for agent subscriptions
      cancel_url: `${baseUrl}/become-agent/subscribe?error=payment_cancelled`,
      language: 'en',
      billing_name: fullName.substring(0, 60),
      billing_email: email.substring(0, 70),
      billing_tel: mobileNumber.substring(0, 20),
      billing_address: residentCountry.substring(0, 150),
      billing_city: 'Dubai',
      billing_state: 'Dubai',
      billing_zip: '000000',
      billing_country: 'AE',
      delivery_name: fullName.substring(0, 50),
      delivery_address: residentCountry.substring(0, 150),
      delivery_city: 'Dubai',
      delivery_state: 'Dubai',
      delivery_zip: '000000',
      delivery_country: 'AE',
      delivery_tel: mobileNumber.substring(0, 20),
      // Merchant parameters to identify agent subscription
      merchant_param1: subscription.id.substring(0, 100), // Subscription ID
      merchant_param2: 'agent_subscription', // Payment type identifier
      merchant_param3: agent.id.substring(0, 100), // Agent ID
    };

    // Create encrypted data
    let plainText = `merchant_id=${merchantId}`;
    const otherParams = Object.entries(paymentParams)
      .filter(([key]) => key !== 'merchant_id')
      .map(([key, value]) => `&${key}=${value}`)
      .join('');

    plainText += otherParams;

    let encryptedData: string;
    try {
      encryptedData = encrypt(plainText, workingKey);
    } catch (encryptError: any) {
      return NextResponse.json(
        {
          error: 'Failed to encrypt payment data',
          details: encryptError?.message || 'Unknown encryption error',
        },
        { status: 500 }
      );
    }

    // Build the payment URL
    const ccavenueBaseUrl = 'https://secure.ccavenue.ae';
    const paymentActionUrl = `${ccavenueBaseUrl}/transaction/transaction.do?command=initiateTransaction`;

    // Return data for frontend to create form submission
    return NextResponse.json({
      success: true,
      redirectUrl: paymentActionUrl,
      encRequest: encryptedData,
      accessCode,
      orderId,
      subscriptionId: subscription.id,
    });
  } catch (error: any) {
    console.error('Error creating agent subscription payment:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
