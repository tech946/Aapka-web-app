import { parseDateStringToLocal } from '@/lib/utils';
import { sendEmail, isEmailConfigured } from '@/lib/nodemailer';

// Helper function for currency formatting
function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

interface BookingEmailData {
  bookingId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerWhatsApp: string;
  bookingDate: string;
  packages: Array<{
    packageName: string;
    packageId: string;
    selectedDate: string | null;
    adults: number;
    children: number;
    infants?: number;
    price: number;
  }>;
  totalAmount: number;
  paymentAmount: number;
  paymentCurrency: string;
  paymentType: string;
  paymentStatus: string;
  paymentTransactionId: string;
  paymentGateway: string;
  passengers: Array<{
    salutation: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    whatsapp: string;
    country: string;
    pickupLocation?: string;
    permanentAddress: string;
    passportExpiry: string;
    nationality?: string;
    /** Uploaded document URLs keyed by document type; null/absent when not uploaded. */
    documents?: Record<string, string | null> | null;
  }>;
}

/**
 * Internal recipients for the "payment received" notification.
 *
 * Set PAYMENT_NOTIFICATION_EMAILS in the environment as a comma-separated list
 * to add or change addresses without a code change. Malformed entries are
 * dropped and the list falls back to the defaults below, so a typo can never
 * leave the team with zero recipients.
 */
const DEFAULT_PAYMENT_NOTIFICATION_EMAILS = [
  'info@aapkatourism.com',
  'sam@aapkatourism.com',
  'tech@aapkatourism.com',
];

export function getPaymentNotificationRecipients(): string[] {
  const parsed = (process.env.PAYMENT_NOTIFICATION_EMAILS ?? '')
    .split(',')
    .map(entry => entry.trim())
    .filter(entry => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry));

  const unique = [...new Set(parsed.map(entry => entry.toLowerCase()))];
  return unique.length > 0 ? unique : DEFAULT_PAYMENT_NOTIFICATION_EMAILS;
}

// Customer Booking Confirmation Email Template
function getCustomerEmailTemplate(data: BookingEmailData): string {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    const d = parseDateStringToLocal(dateString);
    return d
      ? d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : dateString;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${currency} ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(to bottom, #fff7ed 0%, #ffedd5 50%, #fff7ed 100%);">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(to bottom, #fff7ed 0%, #ffedd5 50%, #fff7ed 100%); padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Orange Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                ✈️ Booking Confirmed!
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px;">
                Thank you for choosing Aapka Tourism
              </p>
            </td>
          </tr>

          <!-- Booking ID Section -->
          <tr>
            <td style="padding: 30px 30px 20px 30px; background-color: #ffffff;">
              <div style="background: linear-gradient(to right, #fff7ed 0%, #ffedd5 100%); border-left: 4px solid #f97316; padding: 15px 20px; border-radius: 8px;">
                <p style="margin: 0; color: #9a3412; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                  Booking Reference
                </p>
                <p style="margin: 8px 0 0 0; color: #ea580c; font-size: 24px; font-weight: 700; letter-spacing: 1px;">
                  ${data.bookingId}
                </p>
              </div>
            </td>
          </tr>

          <!-- Customer Info -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <h2 style="margin: 0 0 15px 0; color: #212529; font-size: 20px; font-weight: 600;">
                Customer Information
              </h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #9a3412; font-size: 14px; width: 140px;">Name:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${data.customerName || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #9a3412; font-size: 14px;">Email:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${data.customerEmail || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #9a3412; font-size: 14px;">Phone:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${data.customerPhone || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #9a3412; font-size: 14px;">WhatsApp:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${data.customerWhatsApp || 'N/A'}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Package Details -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <h2 style="margin: 0 0 15px 0; color: #212529; font-size: 20px; font-weight: 600;">
                Package Details
              </h2>
              ${data.packages
                .map(
                  (pkg, index) => `
              <div style="background-color: #fff7ed; border-radius: 8px; padding: 20px; margin-bottom: 15px; border: 1px solid #fed7aa;">
                <h3 style="margin: 0 0 10px 0; color: #ea580c; font-size: 18px; font-weight: 600;">
                  ${pkg.packageName}
                </h3>
                <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                  <tr>
                    <td style="padding: 6px 0; color: #6c757d; font-size: 13px;">Travel Date:</td>
                    <td style="padding: 6px 0; color: #212529; font-size: 13px; font-weight: 500;">${formatDate(pkg.selectedDate)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #6c757d; font-size: 13px;">Adults:</td>
                    <td style="padding: 6px 0; color: #212529; font-size: 13px; font-weight: 500;">${pkg.adults}</td>
                  </tr>
                  ${
                    pkg.children > 0
                      ? `
                  <tr>
                    <td style="padding: 6px 0; color: #6c757d; font-size: 13px;">Children:</td>
                    <td style="padding: 6px 0; color: #212529; font-size: 13px; font-weight: 500;">${pkg.children}</td>
                  </tr>
                  `
                      : ''
                  }
                  ${
                    pkg.infants && pkg.infants > 0
                      ? `
                  <tr>
                    <td style="padding: 6px 0; color: #6c757d; font-size: 13px;">Infants:</td>
                    <td style="padding: 6px 0; color: #212529; font-size: 13px; font-weight: 500;">${pkg.infants}</td>
                  </tr>
                  `
                      : ''
                  }
                  <tr>
                    <td style="padding: 6px 0; color: #6c757d; font-size: 13px;">Package Price:</td>
                    <td style="padding: 6px 0; color: #212529; font-size: 13px; font-weight: 600;">${formatCurrency(pkg.price, data.paymentCurrency)}</td>
                  </tr>
                </table>
              </div>
              `
                )
                .join('')}
            </td>
          </tr>

          <!-- Payment Information -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <h2 style="margin: 0 0 15px 0; color: #212529; font-size: 20px; font-weight: 600;">
                Payment Information
              </h2>
              <div style="background-color: #fff7ed; border-radius: 8px; padding: 20px; border: 1px solid #fed7aa;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #9a3412; font-size: 14px;">Total Amount:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${formatCurrency(data.totalAmount, data.paymentCurrency)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #9a3412; font-size: 14px;">Payment Type:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 500; text-align: right; text-transform: capitalize;">${data.paymentType}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #9a3412; font-size: 14px;">Amount Paid:</td>
                    <td style="padding: 8px 0; color: #ea580c; font-size: 16px; font-weight: 700; text-align: right;">${formatCurrency(data.paymentAmount, data.paymentCurrency)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #9a3412; font-size: 14px;">Transaction ID:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 13px; font-weight: 500; text-align: right; font-family: monospace;">${data.paymentTransactionId || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #9a3412; font-size: 14px;">Payment Gateway:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 13px; font-weight: 500; text-align: right; text-transform: uppercase;">${data.paymentGateway || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #9a3412; font-size: 14px;">Payment Status:</td>
                    <td style="padding: 8px 0; text-align: right;">
                      <span style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; display: inline-block;">
                        ${data.paymentStatus}
                      </span>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- Passengers Information -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <h2 style="margin: 0 0 15px 0; color: #212529; font-size: 20px; font-weight: 600;">
                Passenger Information
              </h2>
              ${data.passengers
                .map(
                  (passenger, index) => `
              <div style="background-color: #fff7ed; border-radius: 8px; padding: 20px; margin-bottom: 15px; border: 1px solid #fed7aa;">
                <h3 style="margin: 0 0 12px 0; color: #ea580c; font-size: 16px; font-weight: 600;">
                  ${index === 0 ? 'Lead Passenger' : `Passenger ${index + 1}`}
                </h3>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0; color: #9a3412; font-size: 13px; width: 140px;">Name:</td>
                    <td style="padding: 5px 0; color: #1f2937; font-size: 13px; font-weight: 500;">${passenger.salutation || ''} ${passenger.firstName || ''} ${passenger.lastName || ''}</td>
                  </tr>
                  ${
                    index === 0
                      ? `
                  <tr>
                    <td style="padding: 5px 0; color: #9a3412; font-size: 13px;">Email:</td>
                    <td style="padding: 5px 0; color: #1f2937; font-size: 13px; font-weight: 500;">${passenger.email || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; color: #9a3412; font-size: 13px;">Phone:</td>
                    <td style="padding: 5px 0; color: #1f2937; font-size: 13px; font-weight: 500;">${passenger.phone || 'N/A'}</td>
                  </tr>
                  `
                      : ''
                  }
                  ${
                    passenger.nationality
                      ? `
                  <tr>
                    <td style="padding: 5px 0; color: #6c757d; font-size: 13px;">Nationality:</td>
                    <td style="padding: 5px 0; color: #212529; font-size: 13px; font-weight: 500;">${passenger.nationality}</td>
                  </tr>
                  `
                      : ''
                  }
                  ${
                    passenger.pickupLocation
                      ? `
                  <tr>
                    <td style="padding: 5px 0; color: #6c757d; font-size: 13px;">Pickup Location:</td>
                    <td style="padding: 5px 0; color: #212529; font-size: 13px; font-weight: 500;">${passenger.pickupLocation}</td>
                  </tr>
                  `
                      : ''
                  }
                  <tr>
                    <td style="padding: 5px 0; color: #9a3412; font-size: 13px;">Address:</td>
                    <td style="padding: 5px 0; color: #1f2937; font-size: 13px; font-weight: 500;">${passenger.permanentAddress || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; color: #9a3412; font-size: 13px;">Passport Expiry:</td>
                    <td style="padding: 5px 0; color: #1f2937; font-size: 13px; font-weight: 500;">${formatDate(passenger.passportExpiry)}</td>
                  </tr>
                </table>
              </div>
              `
                )
                .join('')}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background: linear-gradient(to bottom, #fff7ed 0%, #ffedd5 100%); text-align: center; border-top: 2px solid #fed7aa;">
              <p style="margin: 0 0 10px 0; color: #9a3412; font-size: 14px; line-height: 1.6;">
                If you have any questions or need assistance, please don't hesitate to contact us.
              </p>
              <p style="margin: 0; color: #9a3412; font-size: 13px;">
                <strong style="color: #ea580c;">Aapka Tourism</strong><br>
                Email: ${data.customerEmail ? `<a href="mailto:${data.customerEmail}" style="color: #ea580c; text-decoration: none;">info@aapkatourism.com</a>` : 'info@aapkatourism.com'}<br>
                We're here to make your journey memorable!
              </p>
              <p style="margin: 20px 0 0 0; color: #c2410c; font-size: 12px;">
                This is an automated confirmation email. Please save this for your records.
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

// Internal Notification Email Template
/**
 * Internal "payment received" notification.
 *
 * Sent to the team only after a payment completes successfully - the CCAvenue
 * callback checks order_status first and triggers this fire-and-forget, so
 * nothing here can delay or fail a customer's payment.
 *
 * Every value is derived from the booking record; empty fields are omitted
 * rather than printed as "N/A".
 */
function getInternalEmailTemplate(data: BookingEmailData): string {
  const esc = escapeHtml;

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    const d = parseDateStringToLocal(dateString);
    return d
      ? d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : String(dateString);
  };

  const fmt = (amount: number): string =>
    `${data.paymentCurrency} ${Number(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || 'https://aapkatourism.com'
  ).replace(/\/+$/, '');

  /* Amount maths. A half payment charges 50% of the cart, then the platform fee
     is applied on top of whatever is actually being collected - so the fee is
     the difference between what the card was charged and that base. */
  const isHalf = String(data.paymentType || '').toLowerCase() === 'half';
  const baseAmount = isHalf
    ? Number(data.totalAmount || 0) / 2
    : Number(data.totalAmount || 0);
  const platformFee = Math.max(
    0,
    Number(data.paymentAmount || 0) - baseAmount
  );
  const feePercent =
    baseAmount > 0 && platformFee > 0
      ? Number(((platformFee / baseAmount) * 100).toFixed(2))
      : 0;

  /** One label/value row; returns '' so empty fields disappear entirely. */
  const row = (label: string, valueHtml: string, labelWidth = '130px') =>
    valueHtml
      ? `<tr>
          <td style="padding: 3px 0; color: #9a3412; font-size: 12px; width: ${labelWidth}; vertical-align: top;">${esc(label)}</td>
          <td style="padding: 3px 0; color: #1f2937; font-size: 12px; font-weight: 500;">${valueHtml}</td>
        </tr>`
      : '';

  const DOCUMENT_LABELS: Record<string, string> = {
    applicantPhoto: 'Applicant Photo',
    passportMainCopy: 'Passport Main Copy',
    passportLastPage: 'Passport Last Page',
    passportCover: 'Passport Cover',
    nationalIdCard: 'National ID Card',
    birthCertificate: 'Birth Certificate',
  };

  const documentChips = (
    documents: Record<string, string | null> | null | undefined
  ): string => {
    if (!documents || typeof documents !== 'object') return '';
    const uploaded = Object.entries(documents)
      .filter(([, value]) => !!value)
      .map(([key]) => DOCUMENT_LABELS[key] || key);
    if (uploaded.length === 0) return '';
    return uploaded
      .map(
        label =>
          `<span style="display: inline-block; background-color: #dcfce7; color: #166534; font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 999px; margin: 0 4px 4px 0;">${esc(label)}</span>`
      )
      .join('');
  };

  const paxCount = (pkg: BookingEmailData['packages'][number]): string => {
    const parts: string[] = [];
    const adults = Number(pkg.adults || 0);
    const children = Number(pkg.children || 0);
    const infants = Number(pkg.infants || 0);
    if (adults > 0) parts.push(`${adults} Adult${adults !== 1 ? 's' : ''}`);
    if (children > 0)
      parts.push(`${children} Child${children !== 1 ? 'ren' : ''}`);
    if (infants > 0) parts.push(`${infants} Infant${infants !== 1 ? 's' : ''}`);
    return parts.join(', ');
  };

  const digits = (value: string | undefined) =>
    String(value ?? '').replace(/[^0-9]/g, '');

  const headerMeta = [
    isHalf ? 'Half payment' : 'Full payment',
    data.paymentGateway ? String(data.paymentGateway).toUpperCase() : '',
    formatDate(data.bookingDate),
  ]
    .filter(Boolean)
    .map(esc)
    .join(' &middot; ');

  const packagesHtml = data.packages
    .map(
      pkg => `
              <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-left: 4px solid #f97316; border-radius: 8px; padding: 16px; margin-bottom: 10px;">
                <h3 style="margin: 0 0 10px 0; color: #ea580c; font-size: 15px; font-weight: 600;">
                  ${esc(pkg.packageName || 'Package')}
                </h3>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  ${row('Travel date:', esc(formatDate(pkg.selectedDate)), '110px')}
                  ${row('Travellers:', esc(paxCount(pkg)), '110px')}
                  ${row('Price:', pkg.price ? `<span style="color: #ea580c; font-weight: 600;">${esc(fmt(pkg.price))}</span>` : '', '110px')}
                  ${row('Package ID:', pkg.packageId ? `<span style="color: #6b7280; font-size: 11px; font-family: 'Courier New', Courier, monospace;">${esc(pkg.packageId)}</span>` : '', '110px')}
                </table>
              </div>`
    )
    .join('');

  const passengersHtml = data.passengers
    .map((p, index) => {
      const fullName = [p.salutation, p.firstName, p.lastName]
        .map(part => String(part ?? '').trim())
        .filter(Boolean)
        .join(' ');

      const badge =
        index === 0
          ? `<span style="display: inline-block; background-color: #fff7ed; color: #c2410c; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px; letter-spacing: 0.4px; vertical-align: middle;">MAIN PASSENGER</span>`
          : '';

      const rows = [
        row(
          'Email:',
          p.email
            ? `<a href="mailto:${esc(p.email)}" style="color: #ea580c; text-decoration: none; font-weight: 500;">${esc(p.email)}</a>`
            : ''
        ),
        row(
          'Phone:',
          p.phone
            ? `<a href="tel:${esc(p.phone)}" style="color: #1f2937; text-decoration: none; font-weight: 500;">${esc(p.phone)}</a>`
            : ''
        ),
        row(
          'WhatsApp:',
          p.whatsapp
            ? `<a href="https://wa.me/${esc(digits(p.whatsapp))}" style="color: #25d366; text-decoration: none; font-weight: 500;">${esc(p.whatsapp)}</a>`
            : ''
        ),
        row('Country:', esc(p.country || '')),
        row('Nationality:', esc(p.nationality || '')),
        row('Passport expiry:', esc(formatDate(p.passportExpiry))),
        row('Tour pickup:', esc(p.pickupLocation || '')),
        row('Permanent address:', esc(p.permanentAddress || '')),
        row('Documents:', documentChips(p.documents)),
      ].join('');

      return `
              <table role="presentation" style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 12px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <p style="margin: 0 0 ${rows ? '10px' : '0'} 0; color: #111827; font-size: 14px; font-weight: 600;">
                      ${esc(fullName || `Passenger ${index + 1}`)} ${badge}
                    </p>
                    ${rows ? `<table role="presentation" style="width: 100%; border-collapse: collapse;">${rows}</table>` : ''}
                  </td>
                </tr>
              </table>`;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Received</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(to bottom, #fff7ed 0%, #ffedd5 50%, #fff7ed 100%);">

  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0;">
    ${esc(fmt(data.paymentAmount))} received${data.packages[0]?.packageName ? ` &middot; ${esc(data.packages[0].packageName)}` : ''}${data.customerName ? ` &middot; ${esc(data.customerName)}` : ''}
  </div>

  <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(to bottom, #fff7ed 0%, #ffedd5 50%, #fff7ed 100%); padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 1px solid #fed7aa; box-shadow: 0 4px 6px rgba(249, 115, 22, 0.1); border-radius: 12px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 28px 24px; text-align: center; border-bottom: 3px solid #c2410c;">
              <p style="margin: 0 0 6px 0; color: rgba(255,255,255,0.9); font-size: 12px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;">
                Payment Received
              </p>
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                ${esc(fmt(data.paymentAmount))}
              </h1>
              ${headerMeta ? `<p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 14px; font-weight: 500;">${headerMeta}</p>` : ''}
            </td>
          </tr>

          <!-- Amount breakdown -->
          <tr>
            <td style="padding: 24px 24px 8px 24px;">
              <h2 style="margin: 0 0 14px 0; color: #111827; font-size: 15px; font-weight: 600;">
                Amount Breakdown
              </h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px;">
                <tr>
                  <td style="padding: 12px 16px 6px 16px; color: #9a3412; font-size: 14px;">
                    ${isHalf ? `Half payment (50% of ${esc(fmt(data.totalAmount))})` : 'Package subtotal'}
                  </td>
                  <td align="right" style="padding: 12px 16px 6px 16px; color: #1f2937; font-size: 14px; font-weight: 500;">${esc(fmt(baseAmount))}</td>
                </tr>
                ${
                  platformFee > 0
                    ? `<tr>
                  <td style="padding: 6px 16px; color: #9a3412; font-size: 14px;">Platform fee${feePercent > 0 ? ` (${esc(String(feePercent))}%)` : ''}</td>
                  <td align="right" style="padding: 6px 16px; color: #1f2937; font-size: 14px; font-weight: 500;">${esc(fmt(platformFee))}</td>
                </tr>`
                    : ''
                }
                <tr>
                  <td style="padding: 6px 16px 0 16px;" colspan="2">
                    <div style="border-top: 1px solid #fed7aa; height: 1px; line-height: 1px; font-size: 0;">&nbsp;</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 16px 14px 16px; color: #7c2d12; font-size: 15px; font-weight: 700;">Total charged</td>
                  <td align="right" style="padding: 10px 16px 14px 16px; color: #ea580c; font-size: 17px; font-weight: 700;">${esc(fmt(data.paymentAmount))}</td>
                </tr>
              </table>
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 14px;">
                ${row('Transaction ID:', data.paymentTransactionId ? `<span style="font-family: 'Courier New', Courier, monospace; font-weight: 600;">${esc(data.paymentTransactionId)}</span>` : '')}
                ${row('Booking ID:', data.bookingId ? `<span style="font-family: 'Courier New', Courier, monospace; font-weight: 600;">${esc(data.bookingId)}</span>` : '')}
                ${row('Payment status:', data.paymentStatus ? `<span style="display: inline-block; background-color: #dcfce7; color: #166534; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 999px; letter-spacing: 0.3px; text-transform: uppercase;">${esc(data.paymentStatus)}</span>` : '')}
              </table>
            </td>
          </tr>

          <!-- Customer -->
          <tr>
            <td style="padding: 20px 24px 8px 24px;">
              <h2 style="margin: 0 0 14px 0; color: #111827; font-size: 15px; font-weight: 600;">
                Customer
              </h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                ${row('Name:', esc(data.customerName || ''), '110px')}
                ${row('Email:', data.customerEmail ? `<a href="mailto:${esc(data.customerEmail)}" style="color: #ea580c; text-decoration: none; font-weight: 500;">${esc(data.customerEmail)}</a>` : '', '110px')}
                ${row('Phone:', data.customerPhone ? `<a href="tel:${esc(data.customerPhone)}" style="color: #1f2937; text-decoration: none; font-weight: 500;">${esc(data.customerPhone)}</a>` : '', '110px')}
                ${row('WhatsApp:', data.customerWhatsApp ? `<a href="https://wa.me/${esc(digits(data.customerWhatsApp))}" style="color: #25d366; text-decoration: none; font-weight: 500;">${esc(data.customerWhatsApp)}</a>` : '', '110px')}
              </table>
            </td>
          </tr>

          <!-- Booked -->
          ${
            packagesHtml
              ? `<tr>
            <td style="padding: 20px 24px 8px 24px;">
              <h2 style="margin: 0 0 14px 0; color: #111827; font-size: 15px; font-weight: 600;">
                Booked
              </h2>
              ${packagesHtml}
            </td>
          </tr>`
              : ''
          }

          <!-- Passengers -->
          ${
            passengersHtml
              ? `<tr>
            <td style="padding: 20px 24px 8px 24px;">
              <h2 style="margin: 0 0 14px 0; color: #111827; font-size: 15px; font-weight: 600;">
                Passengers (${data.passengers.length})
              </h2>
              ${passengersHtml}
            </td>
          </tr>`
              : ''
          }

          <!-- Action -->
          <tr>
            <td style="padding: 14px 24px 26px 24px;" align="center">
              <a href="${esc(siteUrl)}/dashboard/payments" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px;">
                Open in Dashboard
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fff7ed; border-top: 1px solid #fed7aa; padding: 16px 24px; text-align: center;">
              <p style="margin: 0; color: #9a3412; font-size: 11px; line-height: 1.6;">
                Automated notification &middot; sent only when a payment completes successfully.<br>
                Aapka Tourism &middot; Office #10118, CBD Bank Building, Al Mankhool, Bur Dubai, UAE
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

export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  console.log(
    `📧 [EMAIL] Starting email send process for Booking #${data.bookingId}`
  );
  console.log(
    `📧 [EMAIL] Customer: ${data.customerName} (${data.customerEmail})`
  );
  console.log(
    `📧 [EMAIL] Amount: ${formatCurrency(data.paymentAmount, data.paymentCurrency)}`
  );

  try {
    // Check if SMTP is configured
    console.log(`📧 [EMAIL] Checking SMTP configuration...`);
    const configured = isEmailConfigured();
    console.log(`📧 [EMAIL] Nodemailer/SMTP: ${configured ? '✅' : '❌'}`);

    if (!configured) {
      console.error(
        '❌ [EMAIL] Email service is disabled - SMTP_HOST, SMTP_USER, SMTP_PASS not configured'
      );
      return { success: false, error: 'Email service not configured' };
    }

    const internalRecipientEmail = getPaymentNotificationRecipients();
    const customerEmail = data.customerEmail;

    // Prepare email subjects
    const customerEmailSubject = `Booking Confirmation #${data.bookingId} - Aapka Tourism`;
    const internalEmailSubject = `Payment received ${formatCurrency(data.paymentAmount, data.paymentCurrency)}${data.packages[0]?.packageName ? ` - ${data.packages[0].packageName}` : ''} - Booking #${data.bookingId}`;

    console.log(`📧 [EMAIL] Preparing to send emails...`);
    console.log(`📧 [EMAIL] Customer email: ${customerEmail}`);
    console.log(`📧 [EMAIL] Internal email: ${internalRecipientEmail.join(', ')}`);

    const results: {
      customerEmailId?: string;
      internalEmailId?: string;
      errors?: string[];
    } = {};
    const errors: string[] = [];

    // Send email to customer
    if (customerEmail) {
      console.log(
        `📧 [EMAIL] Sending customer confirmation email to: ${customerEmail}`
      );
      const customerEmailResult = await sendEmail({
        to: customerEmail,
        subject: customerEmailSubject,
        html: getCustomerEmailTemplate(data),
      });

      if (customerEmailResult.success) {
        results.customerEmailId = customerEmailResult.messageId;
        console.log(
          `✅ [EMAIL] Customer booking confirmation email sent successfully!`
        );
        console.log(`✅ [EMAIL] Message ID: ${results.customerEmailId}`);
      } else {
        const errorMsg = `Failed to send customer email: ${customerEmailResult.error}`;
        console.error(`❌ [EMAIL] ${errorMsg}`);
        errors.push(errorMsg);
      }
    } else {
      const errorMsg = 'Customer email not provided';
      console.error(`❌ [EMAIL] ${errorMsg}`);
      errors.push(errorMsg);
    }

    // Send email to internal team
    console.log(
      `📧 [EMAIL] Sending internal notification email to: ${internalRecipientEmail.join(', ')}`
    );
    const internalEmailResult = await sendEmail({
      to: internalRecipientEmail,
      subject: internalEmailSubject,
      html: getInternalEmailTemplate(data),
    });

    if (internalEmailResult.success) {
      results.internalEmailId = internalEmailResult.messageId;
      console.log(
        `✅ [EMAIL] Internal booking notification email sent successfully!`
      );
      console.log(`✅ [EMAIL] Message ID: ${results.internalEmailId}`);
    } else {
      const errorMsg = `Failed to send internal email: ${internalEmailResult.error}`;
      console.error(`❌ [EMAIL] ${errorMsg}`);
      errors.push(errorMsg);
    }

    // Return success if at least one email was sent
    const hasSuccess = results.customerEmailId || results.internalEmailId;

    return {
      success: hasSuccess,
      ...results,
      ...(errors.length > 0 && { errors }),
    };
  } catch (error: any) {
    console.error(
      `❌ [EMAIL] Error sending booking confirmation email for Booking #${data.bookingId}:`,
      error
    );
    console.error(`❌ [EMAIL] Error details:`, {
      message: error.message,
      stack: error.stack,
      response: error.response?.data || 'No response data',
    });
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

function escapeHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Limited Time Deal: booking fee only (not full package) — matches PDF brochure email layout */
export interface LimitedTimeDealBookingEmailData {
  bookingId: string;
  packageName: string;
  travelDateDisplay: string;
  adults: number;
  children: number;
  infants: number;
  isSoloTraveller: boolean;
  salutation: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp: string;
  bookingFeePaid: number;
  currency: string;
  paymentTransactionId: string;
}

function getLtdEmailAssetsBase(): string {
  return process.env.EMAIL_ASSETS_BASE_URL || 'https://www.aapkatourism.com';
}

function getLtdSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || getLtdEmailAssetsBase()).replace(
    /\/$/,
    ''
  );
}

function formatLtdCurrency(amount: number, currency: string): string {
  return `${currency} ${Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getLimitedTimeDealCustomerEmailTemplate(
  data: LimitedTimeDealBookingEmailData
): string {
  const base = getLtdEmailAssetsBase();
  const siteUrl = getLtdSiteUrl();
  const logoUrl = `${base.replace(/\/$/, '')}/aapka-tourism-logo.png`;
  const dealsUrl = `${siteUrl}/limited-time-deals`;
  const fullName =
    `${data.salutation} ${data.firstName} ${data.lastName}`.trim();
  const partySummary = data.isSoloTraveller
    ? 'Solo traveller'
    : `${data.adults} adult(s), ${data.children} child(ren), ${data.infants} infant(s)`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Limited Time Deal – Booking fee received</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafafa;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 48px 24px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%; background: #ffffff; border: 1px solid #e8e8e8;">
          <tr>
            <td style="padding: 48px 40px 32px; text-align: center; border-bottom: 1px solid #f0f0f0;">
              <img src="${logoUrl}" alt="Aapka Tourism" width="200" style="max-width: 200px; height: auto; display: block; margin: 0 auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #c2410c; letter-spacing: 0.08em; text-transform: uppercase;">Limited time deal</p>
              <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; color: #111827; letter-spacing: -0.02em; line-height: 1.3;">Booking fee received</h1>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #374151; line-height: 1.7;">Dear ${escapeHtml(fullName)},</p>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #4b5563; line-height: 1.7;">
                Thank you. We have received your <strong style="color: #111827;">booking fee</strong> for the limited time offer below. This payment secures your interest in the package — it is <strong style="color: #111827;">not</strong> the full package price. Our team will contact you with next steps.
              </p>

              <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 600; color: #c2410c; text-transform: uppercase; letter-spacing: 0.06em;">Reference</p>
                <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #111827; font-family: ui-monospace, monospace;">${escapeHtml(data.bookingId)}</p>
                <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 600; color: #c2410c; text-transform: uppercase; letter-spacing: 0.06em;">Package</p>
                <p style="margin: 0 0 16px 0; font-size: 17px; font-weight: 600; color: #111827;">${escapeHtml(data.packageName)}</p>
                <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 600; color: #c2410c; text-transform: uppercase; letter-spacing: 0.06em;">Preferred travel date</p>
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #374151;">${escapeHtml(data.travelDateDisplay)}</p>
                <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 600; color: #c2410c; text-transform: uppercase; letter-spacing: 0.06em;">Travellers</p>
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #374151;">${escapeHtml(partySummary)}</p>
                <p style="margin: 0 0 6px 0; font-size: 11px; font-weight: 600; color: #c2410c; text-transform: uppercase; letter-spacing: 0.06em;">Booking fee paid</p>
                <p style="margin: 0; font-size: 22px; font-weight: 700; color: #c2410c;">${formatLtdCurrency(data.bookingFeePaid, data.currency)}</p>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280; line-height: 1.5;">Includes applicable platform fee (3%) on the booking fee portion.</p>
                <p style="margin: 8px 0 0 0; font-size: 13px; color: #6b7280;">Transaction: <span style="font-family: ui-monospace, monospace;">${escapeHtml(data.paymentTransactionId)}</span></p>
              </div>

              <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 600; color: #c2410c; letter-spacing: 0.06em; text-transform: uppercase;">Your contact details</p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-bottom: 28px;">
                <tr><td style="padding: 6px 0; font-size: 14px; color: #6b7280; width: 100px;">Name</td><td style="padding: 6px 0; font-size: 14px; color: #111827;">${escapeHtml(fullName)}</td></tr>
                <tr><td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Email</td><td style="padding: 6px 0; font-size: 14px; color: #111827;"><a href="mailto:${escapeHtml(data.email)}" style="color: #c2410c; text-decoration: none;">${escapeHtml(data.email)}</a></td></tr>
                <tr><td style="padding: 6px 0; font-size: 14px; color: #6b7280;">Phone</td><td style="padding: 6px 0; font-size: 14px; color: #111827;">${escapeHtml(data.phone)}</td></tr>
                <tr><td style="padding: 6px 0; font-size: 14px; color: #6b7280;">WhatsApp</td><td style="padding: 6px 0; font-size: 14px; color: #111827;">${escapeHtml(data.whatsapp)}</td></tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${dealsUrl}" style="display: inline-block; background-color: #c2410c; color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 14px; font-weight: 600; letter-spacing: 0.02em;">View limited time deals</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 32px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                Questions? Reply to this email or contact us at <a href="mailto:info@aapkatourism.com" style="color: #c2410c; text-decoration: none;">info@aapkatourism.com</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 32px; background-color: #fafafa; border-top: 1px solid #f0f0f0;">
              <p style="margin: 0; font-size: 13px; color: #6b7280; text-align: center; font-weight: 600;">Aapka Tourism</p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
                <a href="mailto:info@aapkatourism.com" style="color: #6b7280; text-decoration: none;">info@aapkatourism.com</a>
                <span style="margin: 0 8px; color: #d1d5db;">|</span>
                <a href="${siteUrl}" style="color: #6b7280; text-decoration: none;">${escapeHtml(siteUrl.replace(/^https?:\/\//, ''))}</a>
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

function getLimitedTimeDealInternalEmailTemplate(
  data: LimitedTimeDealBookingEmailData
): string {
  const base = getLtdEmailAssetsBase();
  const siteUrl = getLtdSiteUrl();
  const logoUrl = `${base.replace(/\/$/, '')}/aapka-tourism-logo.png`;
  const fullName =
    `${data.salutation} ${data.firstName} ${data.lastName}`.trim();
  const partySummary = data.isSoloTraveller
    ? 'Solo traveller'
    : `${data.adults} adult(s), ${data.children} child(ren), ${data.infants} infant(s)`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LTD booking fee – ${escapeHtml(data.bookingId)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafafa;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 32px 24px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%; background: #ffffff; border: 1px solid #e8e8e8;">
          <tr>
            <td style="padding: 32px 40px 24px; text-align: center; border-bottom: 1px solid #f0f0f0;">
              <img src="${logoUrl}" alt="Aapka Tourism" width="180" style="max-width: 180px; height: auto; display: block; margin: 0 auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #c2410c; letter-spacing: 0.08em; text-transform: uppercase;">Internal · Limited time deal</p>
              <h1 style="margin: 0 0 20px 0; font-size: 22px; font-weight: 600; color: #111827;">Booking fee payment received</h1>
              <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #374151;"><strong>Booking ID:</strong> ${escapeHtml(data.bookingId)}</p>
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #374151;"><strong>Package:</strong> ${escapeHtml(data.packageName)}</p>
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #374151;"><strong>Travel date:</strong> ${escapeHtml(data.travelDateDisplay)}</p>
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #374151;"><strong>Party:</strong> ${escapeHtml(partySummary)}</p>
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #374151;"><strong>Fee paid:</strong> <span style="color: #c2410c; font-weight: 700;">${formatLtdCurrency(data.bookingFeePaid, data.currency)}</span> <span style="color: #6b7280; font-weight: 400;">(includes 3% platform fee on booking fee)</span></p>
                <p style="margin: 0; font-size: 12px; color: #6b7280; font-family: ui-monospace, monospace;">Txn: ${escapeHtml(data.paymentTransactionId)}</p>
              </div>
              <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 600; color: #c2410c; text-transform: uppercase;">Customer (form)</p>
              <table role="presentation" style="width: 100%; font-size: 13px; color: #374151;">
                <tr><td style="padding: 4px 0; color: #6b7280; width: 90px;">Name</td><td>${escapeHtml(fullName)}</td></tr>
                <tr><td style="padding: 4px 0; color: #6b7280;">Email</td><td><a href="mailto:${escapeHtml(data.email)}" style="color: #c2410c;">${escapeHtml(data.email)}</a></td></tr>
                <tr><td style="padding: 4px 0; color: #6b7280;">Phone</td><td>${escapeHtml(data.phone)}</td></tr>
                <tr><td style="padding: 4px 0; color: #6b7280;">WhatsApp</td><td>${escapeHtml(data.whatsapp)}</td></tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; margin-top: 24px;">
                <tr>
                  <td align="center">
                    <a href="${siteUrl}/limited-time-deals" style="display: inline-block; background-color: #c2410c; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 13px; font-weight: 600;">View limited time deals</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px 28px; background-color: #fafafa; border-top: 1px solid #f0f0f0;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">Aapka Tourism · automated LTD booking fee notice</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendLimitedTimeDealBookingConfirmationEmail(
  data: LimitedTimeDealBookingEmailData
): Promise<{
  success: boolean;
  customerEmailId?: string;
  internalEmailId?: string;
  errors?: string[];
  error?: string;
}> {
  console.log(
    `📧 [LTD EMAIL] Booking #${data.bookingId} — fee ${formatLtdCurrency(data.bookingFeePaid, data.currency)}`
  );

  try {
    if (!isEmailConfigured()) {
      return { success: false, error: 'Email service not configured' };
    }

    const internalTeamEmails = getPaymentNotificationRecipients();
    const errors: string[] = [];
    const results: { customerEmailId?: string; internalEmailId?: string } = {};

    const customerSubject = `Limited Time Deal – booking fee received · ${data.packageName} | Aapka Tourism`;
    const internalSubject = `LTD fee paid #${data.bookingId} · ${formatLtdCurrency(data.bookingFeePaid, data.currency)} · ${data.packageName}`;

    if (data.email) {
      const customerRes = await sendEmail({
        to: data.email,
        subject: customerSubject,
        html: getLimitedTimeDealCustomerEmailTemplate(data),
      });
      if (customerRes.success) results.customerEmailId = customerRes.messageId;
      else errors.push(customerRes.error || 'Customer email failed');
    } else {
      errors.push('Customer email missing');
    }

    const internalRes = await sendEmail({
      to: internalTeamEmails,
      subject: internalSubject,
      html: getLimitedTimeDealInternalEmailTemplate(data),
    });
    if (internalRes.success) results.internalEmailId = internalRes.messageId;
    else errors.push(internalRes.error || 'Internal email failed');

    const hasSuccess = !!(results.customerEmailId || results.internalEmailId);
    return {
      success: hasSuccess,
      ...results,
      ...(errors.length > 0 && { errors }),
    };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to send LTD email';
    return { success: false, error: message };
  }
}

// PDF Brochure Download Email
export interface PdfBrochureEmailData {
  customerName: string;
  customerEmail: string;
  packageName: string;
  pdfUrl: string;
}

function getPdfBrochureEmailTemplate(data: PdfBrochureEmailData): string {
  // Use production URL for logo - emails need publicly accessible image URLs.
  // Set EMAIL_ASSETS_BASE_URL if your site uses a different domain (e.g. Vercel).
  const base =
    process.env.EMAIL_ASSETS_BASE_URL || 'https://www.aapkatourism.com';
  const logoUrl = `${base.replace(/\/$/, '')}/aapka-tourism-logo.png`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your PDF Brochure - Aapka Tourism</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafafa;">
  <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 48px 24px;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%; background: #ffffff; border: 1px solid #e8e8e8;">
          <!-- Logo -->
          <tr>
            <td style="padding: 48px 40px 32px; text-align: center; border-bottom: 1px solid #f0f0f0;">
              <img src="${logoUrl}" alt="Aapka Tourism" width="200" style="max-width: 200px; height: auto; display: block; margin: 0 auto;" />
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #c2410c; letter-spacing: 0.08em; text-transform: uppercase;">Your Brochure</p>
              <h1 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; color: #111827; letter-spacing: -0.02em; line-height: 1.3;">Ready for you</h1>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #374151; line-height: 1.7;">Dear ${data.customerName},</p>
              <p style="margin: 0 0 32px 0; font-size: 15px; color: #4b5563; line-height: 1.7;">
                As requested, here is your PDF brochure for <strong style="color: #111827;">${data.packageName}</strong>. Click the button below to view and download.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                  <td align="center">
                    <a href="${data.pdfUrl}" style="display: inline-block; background-color: #c2410c; color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 14px; font-weight: 600; letter-spacing: 0.02em;">Download PDF Brochure</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 32px 0 0 0; font-size: 14px; color: #6b7280; line-height: 1.6;">
                Should you have any questions or wish to book, we're here to help.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 32px; background-color: #fafafa; border-top: 1px solid #f0f0f0;">
              <p style="margin: 0; font-size: 13px; color: #6b7280; text-align: center; font-weight: 600;">Aapka Tourism</p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #9ca3af; text-align: center;">
                <a href="mailto:info@aapkatourism.com" style="color: #6b7280; text-decoration: none;">info@aapkatourism.com</a>
                <span style="margin: 0 8px; color: #d1d5db;">|</span>
                <a href="https://www.aapkatourism.com" style="color: #6b7280; text-decoration: none;">www.aapkatourism.com</a>
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

export async function sendPdfBrochureEmail(
  data: PdfBrochureEmailData
): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!isEmailConfigured()) {
    return { success: false, error: 'Email service not configured' };
  }

  const result = await sendEmail({
    to: data.customerEmail,
    subject: `Your PDF Brochure - ${data.packageName} | Aapka Tourism`,
    html: getPdfBrochureEmailTemplate(data),
  });

  return result.success
    ? { success: true }
    : { success: false, error: result.error };
}
