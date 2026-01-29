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
  password: string;
  documentImageUrl?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateAgentSubscriptionPaymentRequest = await req.json();
    const { email, fullName, residentCountry, mobileNumber, password, documentImageUrl } = body;

    // Validation
    if (!email || !fullName || !residentCountry || !mobileNumber || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate document image URL if provided
    if (!documentImageUrl || !documentImageUrl.trim()) {
      return NextResponse.json(
        { error: 'Passport/PAN Card/Resident ID document is required' },
        { status: 400 }
      );
    }

    // Validate password
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
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
    const { data: existingAgent, error: checkError } = await supabaseAdmin
      .from('agents')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    // If there's an error checking (not just "not found"), log it but continue
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing agent:', checkError);
      // Continue anyway - might be a temporary DB issue
    }

    if (existingAgent) {
      return NextResponse.json(
        { error: 'An agent with this email already exists. Please use a different email or contact support.' },
        { status: 400 }
      );
    }

    // Note: We'll check for existing user during createUser call
    // If user already exists, createUser will return an error

    // Create user account BEFORE payment (with password, but inactive/pending)
    // This way user can login immediately after payment success
    console.log('[CREATE PAYMENT] Creating user account before payment...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password, // User's actual password
      email_confirm: false, // Don't auto-confirm - will confirm after payment
      user_metadata: {
        full_name: fullName,
        phone: mobileNumber,
        account_status: 'pending_payment', // Mark as pending payment
      },
    });

    if (authError || !authData.user) {
      console.error('[CREATE PAYMENT] Error creating user account:', authError);
      
      // Check if error is due to existing user
      if (authError?.message?.toLowerCase().includes('already') || 
          authError?.message?.toLowerCase().includes('exists') ||
          authError?.message?.toLowerCase().includes('duplicate')) {
        return NextResponse.json(
          { 
            error: 'An account with this email already exists. Please login or use a different email.',
            details: authError.message
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to create account',
          details: authError?.message || 'Unknown error creating user account'
        },
        { status: 500 }
      );
    }

    const userId = authData.user.id;
    console.log('[CREATE PAYMENT] User account created successfully:', userId);

    // Try to create profile for the user (inactive/pending)
    // Note: profiles table might be auto-created by Supabase triggers
    // Only insert id field - other fields may not exist in schema
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        // Only include id - other columns may not exist
        // Supabase might auto-create profiles or have different schema
      });

    if (profileError) {
      console.warn('[CREATE PAYMENT] Profile creation warning (may be auto-created):', profileError.message);
      // Don't fail - profile might be auto-created by Supabase trigger
      // Continue with payment creation
    } else {
      console.log('[CREATE PAYMENT] Profile created successfully');
    }

    // DO NOT create subscription or agent records yet
    // Only create them AFTER payment is successful in the callback
    // Store user_id in merchant params to retrieve after payment
    const subscriptionAmount = 0.01; // Correct amount: 110 AED
    const currency = 'AED';

    // CCAvenue credentials
    const merchantId = '54983';
    const accessCode = 'AVLG05MJ58AS49GLSA';
    const workingKey = '5E25D58B6BF1633A1525984EB4E2E944';

    // Create order ID for agent subscription (using timestamp)
    const timestampShort = Date.now().toString().slice(-6);
    const orderId = `AG${timestampShort}${Math.random().toString(36).substring(2, 8).toUpperCase()}`.substring(0, 30);
    
    // Encode user details to pass via merchant params (will be used to create records after payment)
    // Include user_id so we can activate the account after payment
    const userDetails = {
      userId, // Store user_id to activate account after payment
      email,
      fullName,
      residentCountry,
      mobileNumber,
      documentImageUrl: documentImageUrl || '', // Document image URL from Cloudinary
    };
    // Base64 encode user details (safe for URL)
    const encodedUserDetails = Buffer.from(JSON.stringify(userDetails)).toString('base64');

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
      merchant_param1: orderId, // Order ID for tracking
      merchant_param2: 'agent_subscription', // Payment type identifier
      merchant_param3: encodedUserDetails, // Encoded user details (will create records after payment) - DO NOT truncate
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
    });
  } catch (error: any) {
    console.error('Error creating agent subscription payment:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
