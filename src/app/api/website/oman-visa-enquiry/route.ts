import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/nodemailer';
import { isEmailConfigured } from '@/lib/nodemailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CRM_BASE = process.env.CRM_API_URL || 'https://crm.aapkatourism.com';
const CRM_URL = `${CRM_BASE.replace(/\/$/, '')}/api/website/oman-visa-enquiry`;
const ADMIN_EMAIL = 'info@aapkatourism.com';

const TEXT_FIELDS = [
  'full_name_as_per_passport',
  'nationality',
  'date_of_birth',
  'passport_number',
  'passport_issue_date',
  'passport_expiry_date',
  'contact_number',
  'email',
  'current_address',
  'expected_travel_date',
  'purpose_of_visit',
  'duration_of_stay',
  'declaration_accepted',
];

function getOmanVisaConfirmationEmailHtml(name: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Oman Visa Application Received</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(to bottom, #fff7ed 0%, #ffedd5 50%, #fff7ed 100%);">
  <table role="presentation" style="width: 100%; border-collapse: collapse; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 560px; width: 100%; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0; color: #fff; font-size: 24px; font-weight: 700;">
                Oman Visa Application Received
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.95); font-size: 15px;">
                Thank you for choosing Aapka Tourism
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 24px;">
              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                Dear ${name},
              </p>
              <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                We have received your Oman visa application. Processing time is approximately 24 hours after complete documents and payment confirmation (150 AED).
              </p>
              <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                If you have any questions, contact us at <a href="mailto:${ADMIN_EMAIL}" style="color: #f97316;">${ADMIN_EMAIL}</a>.
              </p>
              <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px;">
                Best regards,<br>
                <strong>Aapka Tourism</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function getAdminNotificationEmailHtml(name: string, email: string, contact: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Oman Visa Application</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; padding: 24px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 560px; width: 100%; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #fff; font-size: 22px; font-weight: 700;">
                New Oman Visa Application – 150 AED
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px;">
              <p style="margin: 0 0 12px 0; color: #1f2937; font-size: 15px;"><strong>Name:</strong> ${name}</p>
              <p style="margin: 0 0 12px 0; color: #1f2937; font-size: 15px;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              <p style="margin: 0 0 12px 0; color: #1f2937; font-size: 15px;"><strong>Contact:</strong> <a href="tel:${contact}">${contact}</a></p>
              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 13px;">
                <a href="https://crm.aapkatourism.com/dashboard/oman-visa-enquiries" style="color: #f97316;">View in CRM → Oman Visa Enquiries</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.WEBSITE_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const forwardFormData = new FormData();

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

    const response = await fetch(CRM_URL, {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: forwardFormData,
    });

    if (response.status === 405) {
      console.error('CRM returned 405 - ensure CRM is deployed and route exists. If testing locally, set CRM_API_URL=http://localhost:3001 in web app .env.local');
    }

    const responseText = await response.text();
    let data: { success?: boolean; error?: string; details?: string } = {};
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      console.error('CRM response (not JSON):', responseText?.substring(0, 500));
      return NextResponse.json(
        {
          error: `CRM returned invalid response (${response.status})`,
          details: responseText?.substring(0, 200) || 'Empty or non-JSON body',
        },
        { status: 502 }
      );
    }

    if (!response.ok) {
      const errMsg = data.error || data.details || `CRM returned ${response.status}`;
      console.error('CRM Oman visa error:', { status: response.status, error: data.error, details: data.details });
      return NextResponse.json(
        { error: errMsg, details: data.details },
        { status: response.status }
      );
    }

    const name = (formData.get('full_name_as_per_passport') as string)?.trim();
    const email = (formData.get('email') as string)?.trim();
    const contact = (formData.get('contact_number') as string)?.trim();

    if (data.success && name && email && isEmailConfigured()) {
      await Promise.allSettled([
        sendEmail({
          to: email,
          subject: 'Oman Visa Application Received - Aapka Tourism',
          html: getOmanVisaConfirmationEmailHtml(name),
        }),
        sendEmail({
          to: ADMIN_EMAIL,
          subject: `New Oman Visa Application: ${name} – 150 AED`,
          html: getAdminNotificationEmailHtml(name, email, contact || ''),
        }),
      ]);
    }

    return NextResponse.json(data, {
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Oman visa enquiry API error:', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}
