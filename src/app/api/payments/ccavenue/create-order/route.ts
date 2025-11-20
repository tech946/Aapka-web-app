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

    const merchantId = process.env.CCAVENUE_MERCHANT_ID || '';
    const accessCode = process.env.CCAVENUE_ACCESS_CODE || '';
    const workingKey = process.env.CCAVENUE_WORKING_KEY || '';

    if (!merchantId || !accessCode || !workingKey) {
      console.error('CCAvenue credentials missing:', {
        hasMerchantId: !!merchantId,
        hasAccessCode: !!accessCode,
        hasWorkingKey: !!workingKey,
      });
      return NextResponse.json(
        { error: 'CCAvenue credentials not configured' },
        { status: 500 }
      );
    }

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

    // Prepare payment parameters
    // Note: CCAvenue requires specific field names (lowercase with underscores)
    const paymentParams: Record<string, string> = {
      merchant_id: merchantId,
      order_id: orderId,
      amount: amount.toFixed(2),
      currency: currency || 'AED', // Use currency from request (AED for international users)
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/payments/ccavenue/callback`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout?error=payment_cancelled`,
      billing_name: customerName,
      billing_email: customerEmail,
      billing_tel: customerPhone,
      billing_address: customerName, // Use name as address if empty
      billing_city: 'Dubai',
      billing_state: 'Dubai',
      billing_zip: '000000',
      billing_country: billingCountry, // Use provided country code
      delivery_name: customerName,
      delivery_address: customerName,
      delivery_city: 'Dubai',
      delivery_state: 'Dubai',
      delivery_zip: '000000',
      delivery_country: billingCountry,
      merchant_param1: bookingId,
      merchant_param2: paymentType,
    };

    // Create encrypted data
    const plainText = Object.entries(paymentParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    const encryptedData = encrypt(plainText, workingKey);

    // Log the redirect URL being used (for debugging)
    console.log('CCAvenue payment request:', {
      redirectUrl: paymentParams.redirect_url,
      orderId: orderId,
      amount: paymentParams.amount,
      currency: paymentParams.currency,
    });

    return NextResponse.json({
      success: true,
      merchantId,
      accessCode,
      encryptedData,
      orderId,
      redirectUrl:
        process.env.CCAVENUE_PAYMENT_URL ||
        'https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction',
    });
  } catch (error: any) {
    console.error('Error creating CCAvenue order:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
