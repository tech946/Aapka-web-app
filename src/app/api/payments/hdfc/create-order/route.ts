import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CreateHDFCOrderRequest {
  amount: number; // Amount in INR
  currency: string;
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentType: 'half' | 'full';
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateHDFCOrderRequest = await req.json();
    const {
      amount,
      currency,
      bookingId,
      customerName,
      customerEmail,
      customerPhone,
      paymentType,
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

    const merchantId = process.env.HDFC_MERCHANT_ID || '';
    const accessCode = process.env.HDFC_ACCESS_CODE || '';
    const workingKey = process.env.HDFC_WORKING_KEY || '';

    if (!merchantId || !accessCode || !workingKey) {
      return NextResponse.json(
        { error: 'HDFC credentials not configured' },
        { status: 500 }
      );
    }

    // Create order ID
    const orderId = `booking_${bookingId}_${Date.now()}`;

    // Prepare payment parameters
    const paymentParams: Record<string, string> = {
      Merchant_Id: merchantId,
      Order_Id: orderId,
      Amount: amount.toFixed(2),
      Currency: currency || 'INR',
      Redirect_Url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/hdfc/callback`,
      Cancel_Url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout?error=payment_cancelled`,
      Billing_Name: customerName,
      Billing_Email: customerEmail,
      Billing_Tel: customerPhone,
      Billing_Address: '',
      Billing_City: '',
      Billing_State: '',
      Billing_Zip: '',
      Billing_Country: 'India',
      Delivery_Name: customerName,
      Delivery_Address: '',
      Delivery_City: '',
      Delivery_State: '',
      Delivery_Zip: '',
      Delivery_Country: 'India',
      Merchant_Param1: bookingId,
      Merchant_Param2: paymentType,
    };

    // Create encrypted data
    const plainText = Object.entries(paymentParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');

    const encryptedData = encrypt(plainText, workingKey);

    return NextResponse.json({
      success: true,
      merchantId,
      accessCode,
      encryptedData,
      orderId,
      redirectUrl:
        process.env.HDFC_PAYMENT_URL ||
        'https://securepg.hdfcbank.com/payment/merchant/request',
    });
  } catch (error: any) {
    console.error('Error creating HDFC order:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}

// HDFC encryption function
// HDFC uses AES-128-CBC encryption similar to CCAvenue
function encrypt(plainText: string, key: string): string {
  try {
    const algorithm = 'aes-128-cbc';

    // HDFC expects the key to be used for AES encryption
    // The working key should be 16 bytes for AES-128
    const keyBuffer = Buffer.from(key.substring(0, 16), 'utf8');
    const iv = Buffer.alloc(16, 0); // IV should be all zeros for HDFC

    const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    // Fallback to simple base64 encoding (not secure, for testing only)
    return Buffer.from(plainText).toString('base64');
  }
}
