import { NextRequest, NextResponse } from 'next/server';
import { encrypt } from '@/lib/ccavenue-crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CreateCCAvenueOrderRequest {
  amount: number; // Amount in specified currency (AED for international, INR for Indian)
  currency: string;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentType: 'half' | 'full';
  billingCountry?: string; // Country code for billing
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateCCAvenueOrderRequest = await req.json();
    const {
      amount,
      currency,
      bookingId,
      customerName,
      customerEmail,
      customerPhone,
      paymentType,
      billingCountry = 'AE', // Default to UAE for international users
    } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Using credentials directly (as provided)
    const merchantId = '54983';
    const accessCode = 'AVLG05MJ58AS49GLSA';
    const workingKey = '5E25D58B6BF1633A1525984EB4E2E944';

    // Fallback to env if needed (for production)
    // const merchantId = process.env.CCAVENUE_MERCHANT_ID || '54983';
    // const accessCode = process.env.CCAVENUE_ACCESS_CODE || 'AVLG05MJ58AS49GLSA';
    // const workingKey = process.env.CCAVENUE_WORKING_KEY || '5E25D58B6BF1633A1525984EB4E2E944';

    console.log('=== USING CCAVENUE CREDENTIALS ===');
    console.log('Merchant ID:', merchantId);
    console.log('Access Code:', accessCode);
    console.log('Working Key length:', workingKey.length);
    console.log('==================================');

    // Log for debugging (remove in production)
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/payments/ccavenue/callback`;
    console.log('CCAvenue credentials check:', {
      merchantId: merchantId.substring(0, 3) + '...',
      accessCode: accessCode.substring(0, 3) + '...',
      hasWorkingKey: workingKey.length > 0,
      redirectUrl: redirectUrl,
      appUrl:
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_SITE_URL ||
        'http://localhost:3000',
    });

    // Create order ID
    const orderId = `booking_${bookingId}_${Date.now()}`;

    // Prepare payment parameters according to CCAvenue official documentation
    // Required parameters: merchant_id, order_id, currency, amount, redirect_url, cancel_url, language
    // merchant_id MUST be in encrypted data (not as separate form field)
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000';

    const paymentParams: Record<string, string> = {
      merchant_id: merchantId, // Required - must be in encrypted data
      order_id: orderId, // Required - unique order identifier (max 30 chars, alphanumeric with -/_)
      amount: amount.toFixed(2), // Required - order amount (numeric, 12 digits, 2 decimals)
      currency: currency || 'INR', // Required - must match account currency (INR/USD/SGD/GBP/EUR)
      redirect_url: `${baseUrl}/api/payments/ccavenue/callback`, // Required - MUST be registered in CCAvenue MARS
      cancel_url: `${baseUrl}/checkout?error=payment_cancelled`, // Required
      language: 'en', // Required - billing page language (en/hi/gu/mr/bn)
      // Billing information (optional but recommended to avoid errors)
      billing_name: (customerName || 'Customer').substring(0, 60), // Alphabets only, max 60 chars
      billing_email: (customerEmail || '').substring(0, 70), // Alphanumeric with @, dot, underscore, max 70 chars
      billing_tel: (customerPhone || '').substring(0, 20), // Numeric, max 20 chars
      billing_address: (customerName || 'Dubai').substring(0, 150), // Alphanumeric with special chars, max 150 chars
      billing_city: 'Dubai', // Alphabets only, max 30 chars
      billing_state: 'Dubai', // Alphabets only, max 30 chars
      billing_zip: '000000', // Alphanumeric, max 15 chars
      billing_country: (billingCountry || 'AE').substring(0, 50), // Alphabets only, max 50 chars
      // Delivery information (optional but recommended)
      delivery_name: (customerName || 'Customer').substring(0, 50),
      delivery_address: (customerName || 'Dubai').substring(0, 150),
      delivery_city: 'Dubai',
      delivery_state: 'Dubai',
      delivery_zip: '000000',
      delivery_country: (billingCountry || 'AE').substring(0, 50),
      delivery_tel: (customerPhone || '').substring(0, 20),
      // Merchant parameters for additional info (optional)
      merchant_param1: bookingId.substring(0, 100), // Alphanumeric with special chars, max 100 chars
      merchant_param2: paymentType.substring(0, 100), // Alphanumeric with special chars, max 100 chars
    };

    // Create encrypted data
    // IMPORTANT: According to the guide, merchant_id must be FIRST in the encrypted string
    // Format: merchant_id=XXX&key=value&key=value
    let plainText = `merchant_id=${merchantId}`;

    // Add all other parameters (excluding merchant_id since it's already added)
    const otherParams = Object.entries(paymentParams)
      .filter(([key]) => key !== 'merchant_id')
      .map(([key, value]) => `&${key}=${value}`)
      .join('');

    plainText += otherParams;

    // Log plain text for debugging (first 200 chars)
    console.log('=== PLAIN TEXT TO ENCRYPT ===');
    console.log(
      plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '')
    );
    console.log('Full length:', plainText.length);
    console.log('=============================');

    let encryptedData: string;
    try {
      encryptedData = encrypt(plainText, workingKey);
      console.log('Encryption successful');
      console.log('Encrypted length:', encryptedData.length);
      console.log(
        'Encrypted (first 100 chars):',
        encryptedData.substring(0, 100)
      );
    } catch (encryptError: any) {
      console.error('Encryption failed:', encryptError);
      return NextResponse.json(
        {
          error: 'Failed to encrypt payment data',
          details: encryptError?.message || 'Unknown encryption error',
        },
        { status: 500 }
      );
    }

    // Log the redirect URL being used (for debugging)
    // IMPORTANT: The redirect_url MUST be registered in CCAvenue MARS account
    // Steps to register:
    // 1. Login to CCAvenue MARS account
    // 2. Go to Settings (top right) > Dynamic Event Notifications
    // 3. Add/Register this exact URL: [redirectUrl shown below]
    // 4. Save the settings
    console.log('=== CCAvenue Payment Configuration ===');
    console.log('REDIRECT URL TO REGISTER:', paymentParams.redirect_url);
    console.log('CANCEL URL:', paymentParams.cancel_url);
    console.log('Currency:', paymentParams.currency);
    console.log('Amount:', paymentParams.amount);
    console.log('Order ID:', orderId);
    console.log('Merchant ID:', merchantId.substring(0, 3) + '...');
    console.log('=====================================');
    console.log(
      '⚠️  ACTION REQUIRED: Register the redirect URL above in CCAvenue MARS:'
    );
    console.log('   Settings > Dynamic Event Notifications > Add URL');
    console.log('=====================================');

    // Build the payment URL exactly as shown in the guide
    // Format: https://secure.ccavenue.ae/transaction/transaction.do?command=initiateTransaction&merchant_id=XXX&encRequest=XXX&access_code=XXX
    // Key names must be exactly: merchant_id, encRequest, access_code (as per guide)
    // NOTE: Using .ae domain for Dubai account

    // Determine which domain to use (.com for India, .ae for UAE)
    // Account is in Dubai, so ALWAYS use .ae domain
    const ccavenueBaseUrl = 'https://secure.ccavenue.ae'; // Fixed to .ae for Dubai account

    // Build URL exactly as shown in guide
    // The guide shows: merchant_id, encRequest, access_code as query parameters
    // Note: encRequest contains hex characters, so we need to URL-encode it
    // merchant_id and access_code are alphanumeric, but encoding is safer
    // Build URL - try both encoded and non-encoded versions
    // Option 1: No encoding (as guide shows)
    const paymentUrlNoEncode = `${ccavenueBaseUrl}/transaction/transaction.do?command=initiateTransaction&merchant_id=${merchantId}&encRequest=${encryptedData}&access_code=${accessCode}`;

    // Option 2: With encoding (safer for hex characters)
    const paymentUrlWithEncode = `${ccavenueBaseUrl}/transaction/transaction.do?command=initiateTransaction&merchant_id=${encodeURIComponent(merchantId)}&encRequest=${encodeURIComponent(encryptedData)}&access_code=${encodeURIComponent(accessCode)}`;

    // Use encoded version (more reliable)
    const paymentUrl = paymentUrlWithEncode;
    // IMPORTANT: Always use the constructed .ae URL, no environment variable override
    const finalPaymentUrl = paymentUrl; // Fixed to always use .ae domain

    // Log the exact URL being used (for debugging)
    console.log('=== PAYMENT URL CONSTRUCTION ===');
    console.log('Base URL:', ccavenueBaseUrl, '(Dubai account - .ae domain)');
    console.log('Merchant ID:', merchantId);
    console.log('Access Code:', accessCode);
    console.log('Encrypted Data (first 50):', encryptedData.substring(0, 50));
    console.log('Redirect URL:', paymentParams.redirect_url);
    console.log(
      'URL (NO encoding, first 200):',
      paymentUrlNoEncode.substring(0, 200)
    );
    console.log(
      'URL (WITH encoding, first 200):',
      paymentUrlWithEncode.substring(0, 200)
    );
    console.log('Using:', 'WITH encoding');
    console.log(
      'Final URL (first 300 chars):',
      finalPaymentUrl.substring(0, 300)
    );
    console.log('================================');

    // Additional debug info
    console.log(
      '⚠️  REMEMBER: Domain must be registered with CCAvenue Customer Help Center'
    );
    console.log('   Your redirect URL:', paymentParams.redirect_url);

    return NextResponse.json({
      success: true,
      merchantId,
      accessCode,
      encryptedData,
      orderId,
      paymentUrl: finalPaymentUrl, // Full URL with all params (as per guide)
    });
  } catch (error: any) {
    console.error('Error creating CCAvenue order:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
