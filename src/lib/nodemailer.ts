import nodemailer from 'nodemailer';

const DEFAULT_FROM = 'Aapka Tourism <noreply@aapkatourism.com>';

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT
    ? parseInt(process.env.SMTP_PORT, 10)
    : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

const transporter = createTransport();

export function isEmailConfigured(): boolean {
  return !!transporter;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  attachments?: EmailAttachment[];
}

export async function sendEmail(options: SendEmailOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  if (!transporter) {
    return {
      success: false,
      error: 'Email service not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS.',
    };
  }

  try {
    const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    const result = await transporter.sendMail({
      from: options.from || process.env.EMAIL_FROM || DEFAULT_FROM,
      to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('[NODEMAILER] Send failed:', err.message);
    return {
      success: false,
      error: err.message || 'Failed to send email',
    };
  }
}
