import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/nodemailer';
import { isEmailConfigured } from '@/lib/nodemailer';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { randomUUID } from 'crypto';

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

const BUCKET_NAME = 'documents';

async function storeOmanVisaLocally(
  formData: FormData,
  passportFront: FormDataEntryValue | null,
  passportInside: FormDataEntryValue | null,
  photograph: FormDataEntryValue | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const enquiryId = randomUUID();
    const prefix = `oman-visa/${enquiryId}`;

    const uploadFile = async (file: FormDataEntryValue, name: string): Promise<string | null> => {
      if (!(file instanceof Blob) || file.size === 0) return null;
      const ext = file.name?.split('.').pop() || (file.type?.includes('pdf') ? 'pdf' : 'jpg');
      const path = `${prefix}/${name}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(path, buffer, { contentType: file.type || 'application/octet-stream', upsert: false });
      if (error) {
        console.error(`Oman visa: failed to upload ${name}:`, error);
        return null;
      }
      const { data: urlData } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(data.path);
      return urlData.publicUrl;
    };

    const [passportFrontUrl, passportInsideUrl, photographUrl] = await Promise.all([
      passportFront ? uploadFile(passportFront, 'passport_front') : null,
      passportInside ? uploadFile(passportInside, 'passport_inside') : null,
      photograph ? uploadFile(photograph, 'photograph') : null,
    ]);

    const getStr = (k: string) => (formData.get(k) as string)?.trim() || null;
    const getDate = (k: string) => {
      const v = getStr(k);
      if (!v) return null;
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
    };

    const { error } = await supabaseAdmin.from('oman_visa_enquiries').insert({
      full_name_as_per_passport: getStr('full_name_as_per_passport'),
      nationality: getStr('nationality'),
      date_of_birth: getDate('date_of_birth'),
      passport_number: getStr('passport_number'),
      passport_issue_date: getDate('passport_issue_date'),
      passport_expiry_date: getDate('passport_expiry_date'),
      contact_number: getStr('contact_number'),
      email: getStr('email'),
      current_address: getStr('current_address'),
      expected_travel_date: getDate('expected_travel_date'),
      purpose_of_visit: getStr('purpose_of_visit'),
      duration_of_stay: getStr('duration_of_stay'),
      passport_front_url: passportFrontUrl,
      passport_inside_url: passportInsideUrl,
      photograph_url: photographUrl,
      declaration_accepted: getStr('declaration_accepted') === 'true',
      status: 'new',
    });

    if (error) {
      console.error('Oman visa: failed to insert enquiry:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (e: unknown) {
    console.error('Oman visa fallback error:', e);
    return { success: false, error: e instanceof Error ? e.message : 'Storage failed' };
  }
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

    const responseText = await response.text();
    let data: { success?: boolean; error?: string; details?: string } = {};
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      if (response.ok) {
        data = {};
      }
    }

    const name = (formData.get('full_name_as_per_passport') as string)?.trim();
    const email = (formData.get('email') as string)?.trim();
    const contact = (formData.get('contact_number') as string)?.trim();

    // When CRM returns 405 or other error, fallback to storing in web app Supabase
    if (!response.ok) {
      console.warn('CRM Oman visa returned', response.status, '- falling back to local Supabase storage');
      const stored = await storeOmanVisaLocally(formData, passportFront, passportInside, photograph);
      if (!stored.success) {
        return NextResponse.json(
          { error: stored.error || 'Failed to submit application' },
          { status: 500 }
        );
      }
      if (name && email && isEmailConfigured()) {
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
      return NextResponse.json(
        { success: true, message: 'Application submitted successfully' },
        {
          status: 201,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
          },
        }
      );
    }

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
