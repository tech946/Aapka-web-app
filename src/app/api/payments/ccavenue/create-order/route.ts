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

    // Create order ID (max 30 chars for CCAvenue)
    // Format: BK<last-12-chars-of-bookingId><last-6-digits-of-timestamp>
    // Example: BK123456789abc987654 (20 chars total, well under 30 limit)
    const bookingIdShort = bookingId.slice(-12).replace(/-/g, ''); // Remove hyphens, take last 12
    const timestampShort = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const orderId = `BK${bookingIdShort}${timestampShort}`.substring(0, 30); // Ensure max 30 chars

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
      currency: currency || 'AED', // Required - must match account currency (AED for Dubai account)
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

    // Build the payment URL exactly as per CCAvenue official JSP example
    // IMPORTANT: encRequest and access_code are sent as POST form data, NOT in URL
    // URL only contains: base_url + command parameter
    const ccavenueBaseUrl = 'https://secure.ccavenue.ae'; // Official documentation URL

    // Clean URL - NO parameters except command (as per official JSP example)
    const paymentActionUrl = `${ccavenueBaseUrl}/transaction/transaction.do?command=initiateTransaction`;
    // Return data for frontend to create form submission
    return NextResponse.json({
      success: true,
      redirectUrl: paymentActionUrl, // Clean URL with only command parameter
      encRequest: encryptedData, // To be sent as POST form data
      accessCode, // To be sent as POST form data
      orderId,
    });
  } catch (error: any) {
    console.error('Error creating CCAvenue order:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
