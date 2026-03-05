import { NextRequest, NextResponse } from 'next/server';
import { encrypt } from '@/lib/ccavenue-crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OMAN_VISA_AMOUNT_AED = 0.01; // Testing: normally 150

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.WEBSITE_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const formData = await req.formData();
    const forwardFormData = new FormData();

    const TEXT_FIELDS = [
      'full_name_as_per_passport',
      'nationality',
      'contact_number',
      'email',
      'expected_travel_date',
      'purpose_of_visit',
      'duration_of_stay',
      'declaration_accepted',
    ];

    for (const field of TEXT_FIELDS) {
      const val = formData.get(field);
      if (val != null) forwardFormData.append(field, String(val));
    }

    const passportFront = formData.get('passport_front');
    const passportInside = formData.get('passport_inside');
    const photograph = formData.get('photograph');
    if (passportFront instanceof Blob) forwardFormData.append('passport_front', passportFront);
    if (passportInside instanceof Blob) forwardFormData.append('passport_inside', passportInside);
    if (photograph instanceof Blob) forwardFormData.append('photograph', photograph);

    const crmBase = process.env.CRM_API_URL || 'https://crm.aapkatourism.com';
    const uploadUrl = `${crmBase.replace(/\/$/, '')}/api/website/oman-visa-enquiry/upload-and-prepare`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: forwardFormData,
    });

    const responseText = await response.text();
    let data: { success?: boolean; order_id?: string; customer_name?: string; customer_email?: string; customer_phone?: string; error?: string } = {};
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      return NextResponse.json(
        { error: 'Failed to prepare application', details: responseText?.substring(0, 200) },
        { status: 502 }
      );
    }

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { error: data.error || 'Failed to prepare application' },
        { status: response.ok ? 400 : response.status }
      );
    }

    const orderId = data.order_id!;
    const customerName = data.customer_name || 'Customer';
    const customerEmail = data.customer_email || '';
    const customerPhone = data.customer_phone || '';

    const merchantId = process.env.CCAVENUE_MERCHANT_ID || '54983';
    const accessCode = process.env.CCAVENUE_ACCESS_CODE || 'AVLG05MJ58AS49GLSA';
    const workingKey = process.env.CCAVENUE_WORKING_KEY || '5E25D58B6BF1633A1525984EB4E2E944';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;

    const paymentParams: Record<string, string> = {
      merchant_id: merchantId,
      order_id: orderId,
      amount: OMAN_VISA_AMOUNT_AED.toFixed(2),
      currency: 'AED',
      redirect_url: `${baseUrl}/api/payments/ccavenue/callback`,
      cancel_url: `${baseUrl}/visas/apply-for-oman-visa?error=payment_cancelled`,
      language: 'en',
      billing_name: customerName.substring(0, 60),
      billing_email: customerEmail.substring(0, 70),
      billing_tel: customerPhone.substring(0, 20),
      billing_address: 'Oman Visa',
      billing_city: 'Dubai',
      billing_state: 'Dubai',
      billing_zip: '000000',
      billing_country: 'AE',
      merchant_param1: orderId,
      merchant_param2: 'oman_visa',
    };

    let plainText = `merchant_id=${merchantId}`;
    const otherParams = Object.entries(paymentParams)
      .filter(([key]) => key !== 'merchant_id')
      .map(([key, value]) => `&${key}=${value}`)
      .join('');
    plainText += otherParams;

    let encryptedData: string;
    try {
      encryptedData = encrypt(plainText, workingKey);
    } catch {
      return NextResponse.json({ error: 'Failed to encrypt payment data' }, { status: 500 });
    }

    const ccavenueBaseUrl = 'https://secure.ccavenue.ae';
    const paymentActionUrl = `${ccavenueBaseUrl}/transaction/transaction.do?command=initiateTransaction`;

    return NextResponse.json({
      success: true,
      redirectUrl: paymentActionUrl,
      encRequest: encryptedData,
      accessCode,
      orderId,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Oman visa create-order error:', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
