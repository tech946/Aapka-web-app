import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, isEmailConfigured } from '@/lib/nodemailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'info@aapkatourism.com';

function getOmanVisaConfirmationHtml(name: string): string {
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
              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">Dear ${name},</p>
              <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                We have received your Oman visa application and payment. Processing time is approximately 24 hours.
              </p>
              <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                If you have any questions, contact us at <a href="mailto:${ADMIN_EMAIL}" style="color: #f97316;">${ADMIN_EMAIL}</a>.
              </p>
              <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 14px;">
                Best regards,<br><strong>Aapka Tourism</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function getAdminNotificationHtml(name: string, email: string, contact: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Oman Visa Application</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Poppins', sans-serif; background: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; padding: 24px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 560px; width: 100%; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #fff; font-size: 22px; font-weight: 700;">New Oman Visa Application – 150 AED (Paid)</h1>
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
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, contact = '', transactionId } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'name and email required' }, { status: 400 });
    }

    if (!isEmailConfigured()) {
      return NextResponse.json({ error: 'Email not configured' }, { status: 500 });
    }

    await Promise.allSettled([
      sendEmail({
        to: email,
        subject: 'Oman Visa Application Received - Aapka Tourism',
        html: getOmanVisaConfirmationHtml(name),
      }),
      sendEmail({
        to: ADMIN_EMAIL,
        subject: `New Oman Visa Application (Paid): ${name} – 150 AED`,
        html: getAdminNotificationHtml(name, email, contact),
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Oman visa confirmation email error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
