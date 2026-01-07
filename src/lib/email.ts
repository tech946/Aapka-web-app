import { Resend } from 'resend';
import { parseDateStringToLocal } from '@/lib/utils';

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

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
  }>;
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
function getInternalEmailTemplate(data: BookingEmailData): string {
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
  <title>New Booking Notification</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(to bottom, #fff7ed 0%, #ffedd5 50%, #fff7ed 100%);">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(to bottom, #fff7ed 0%, #ffedd5 50%, #fff7ed 100%); padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 1px solid #fed7aa; box-shadow: 0 4px 6px rgba(249, 115, 22, 0.1); border-radius: 12px; overflow: hidden;">
          
          <!-- Header with Orange Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px 24px; text-align: center; border-bottom: 3px solid #c2410c;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">
                🎉 New Booking Received!
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.95); font-size: 16px; font-weight: 500;">
                Booking #${data.bookingId} • ${formatCurrency(data.paymentAmount, data.paymentCurrency)} received
              </p>
            </td>
          </tr>

          <!-- Customer Information -->
          <tr>
            <td style="padding: 24px;">
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 16px; font-weight: 600;">
                Customer Information
              </h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 6px 0; color: #9a3412; font-size: 14px; width: 120px;">Name:</td>
                  <td style="padding: 6px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${data.customerName || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #9a3412; font-size: 14px;">Email:</td>
                  <td style="padding: 6px 0;">
                    <a href="mailto:${data.customerEmail}" style="color: #ea580c; font-size: 14px; text-decoration: none; font-weight: 500;">${data.customerEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #9a3412; font-size: 14px;">Phone:</td>
                  <td style="padding: 6px 0;">
                    <a href="tel:${data.customerPhone}" style="color: #1f2937; font-size: 14px; text-decoration: none; font-weight: 500;">${data.customerPhone || 'N/A'}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #9a3412; font-size: 14px;">WhatsApp:</td>
                  <td style="padding: 6px 0;">
                    <a href="https://wa.me/${data.customerWhatsApp ? data.customerWhatsApp.replace(/[^0-9]/g, '') : ''}" style="color: #25d366; font-size: 14px; text-decoration: none; font-weight: 500;">${data.customerWhatsApp || 'N/A'}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #9a3412; font-size: 14px;">Booking Date:</td>
                  <td style="padding: 6px 0; color: #1f2937; font-size: 14px; font-weight: 500;">${formatDate(data.bookingDate)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Package Details -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 16px; font-weight: 600;">
                Package Details
              </h2>
              ${data.packages
                .map(
                  pkg => `
              <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-left: 4px solid #f97316; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                <h3 style="margin: 0 0 12px 0; color: #ea580c; font-size: 15px; font-weight: 600;">
                  ${pkg.packageName}
                </h3>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 4px 0; color: #9a3412; font-size: 13px; width: 120px;">Package ID:</td>
                    <td style="padding: 4px 0; color: #1f2937; font-size: 13px; font-family: monospace; font-weight: 500;">${pkg.packageId || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #9a3412; font-size: 13px;">Travel Date:</td>
                    <td style="padding: 4px 0; color: #1f2937; font-size: 13px; font-weight: 500;">${formatDate(pkg.selectedDate)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #9a3412; font-size: 13px;">Passengers:</td>
                    <td style="padding: 4px 0; color: #1f2937; font-size: 13px; font-weight: 500;">
                      ${pkg.adults || 0} Adult${(pkg.adults || 0) !== 1 ? 's' : ''}
                      ${(pkg.children || 0) > 0 ? `, ${pkg.children} Child${pkg.children !== 1 ? 'ren' : ''}` : ''}
                      ${pkg.infants && pkg.infants > 0 ? `, ${pkg.infants} Infant${pkg.infants !== 1 ? 's' : ''}` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #9a3412; font-size: 13px;">Price:</td>
                    <td style="padding: 4px 0; color: #ea580c; font-size: 13px; font-weight: 600;">${formatCurrency(pkg.price || 0, data.paymentCurrency)}</td>
                  </tr>
                </table>
              </div>
              `
                )
                .join('')}
            </td>
          </tr>

          <!-- Payment Details -->
          <tr>
            <td style="padding: 0 24px 24px 24px;">
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 16px; font-weight: 600;">
                Payment Information
              </h2>
              <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-left: 4px solid #f97316; border-radius: 8px; padding: 16px;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #9a3412; font-size: 14px; width: 160px;">Total Amount:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; font-weight: 600; text-align: right;">${formatCurrency(data.totalAmount, data.paymentCurrency)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #9a3412; font-size: 14px;">Payment Type:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 14px; text-align: right; text-transform: capitalize;">${data.paymentType}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #9a3412; font-size: 14px;">Amount Paid:</td>
                    <td style="padding: 8px 0; color: #ea580c; font-size: 15px; font-weight: 700; text-align: right;">${formatCurrency(data.paymentAmount, data.paymentCurrency)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #9a3412; font-size: 13px;">Transaction ID:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 13px; text-align: right; font-family: monospace;">${data.paymentTransactionId || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #9a3412; font-size: 13px;">Payment Gateway:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-size: 13px; text-align: right; text-transform: uppercase;">${data.paymentGateway || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #9a3412; font-size: 13px;">Status:</td>
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
            <td style="padding: 0 24px 24px 24px;">
              <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 16px; font-weight: 600;">
                Passenger Details
              </h2>
              ${data.passengers
                .map(
                  (passenger, index) => `
              <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-left: 4px solid #f97316; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                <h3 style="margin: 0 0 12px 0; color: #ea580c; font-size: 14px; font-weight: 600;">
                  ${index === 0 ? 'Lead Passenger' : `Passenger ${index + 1}`}
                </h3>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 4px 0; color: #9a3412; font-size: 13px; width: 120px;">Name:</td>
                    <td style="padding: 4px 0; color: #1f2937; font-size: 13px; font-weight: 500;">${passenger.salutation || ''} ${passenger.firstName || ''} ${passenger.lastName || ''}</td>
                  </tr>
                  ${
                    index === 0
                      ? `
                  <tr>
                    <td style="padding: 4px 0; color: #9a3412; font-size: 13px;">Email:</td>
                    <td style="padding: 4px 0; color: #1f2937; font-size: 13px; font-weight: 500;">${passenger.email || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #9a3412; font-size: 13px;">Phone:</td>
                    <td style="padding: 4px 0; color: #1f2937; font-size: 13px; font-weight: 500;">${passenger.phone || 'N/A'}</td>
                  </tr>
                  `
                      : ''
                  }
                  <tr>
                    <td style="padding: 4px 0; color: #9a3412; font-size: 13px;">Country:</td>
                    <td style="padding: 4px 0; color: #1f2937; font-size: 13px; font-weight: 500;">${passenger.country || 'N/A'}</td>
                  </tr>
                  ${
                    passenger.nationality
                      ? `
                  <tr>
                    <td style="padding: 4px 0; color: #9a3412; font-size: 13px;">Nationality:</td>
                    <td style="padding: 4px 0; color: #1f2937; font-size: 13px; font-weight: 500;">${passenger.nationality || 'N/A'}</td>
                  </tr>
                  `
                      : ''
                  }
                  ${
                    passenger.pickupLocation
                      ? `
                  <tr>
                    <td style="padding: 4px 0; color: #9a3412; font-size: 13px;">Pickup Location:</td>
                    <td style="padding: 4px 0; color: #1f2937; font-size: 13px; font-weight: 500;">${passenger.pickupLocation || 'N/A'}</td>
                  </tr>
                  `
                      : ''
                  }
                  <tr>
                    <td style="padding: 4px 0; color: #9a3412; font-size: 13px;">Address:</td>
                    <td style="padding: 4px 0; color: #1f2937; font-size: 13px; font-weight: 500;">${passenger.permanentAddress || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #9a3412; font-size: 13px;">Passport Expiry:</td>
                    <td style="padding: 4px 0; color: #1f2937; font-size: 13px; font-weight: 500;">${formatDate(passenger.passportExpiry)}</td>
                  </tr>
                </table>
              </div>
              `
                )
                .join('')}
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
    // Check if Resend is configured
    console.log(`📧 [EMAIL] Checking Resend configuration...`);
    const hasResend = !!resend;
    const hasApiKey = !!process.env.RESEND_API_KEY;
    console.log(
      `📧 [EMAIL] Resend instance: ${hasResend ? '✅' : '❌'}, API Key: ${hasApiKey ? '✅' : '❌'}`
    );

    if (!resend || !process.env.RESEND_API_KEY) {
      console.error(
        '❌ [EMAIL] Email service is disabled - RESEND_API_KEY not configured'
      );
      return { success: false, error: 'Email service not configured' };
    }

    const internalRecipientEmail = 'rawatajay9092@gmail.com';
    const customerEmail = data.customerEmail;

    // Prepare email subjects
    const customerEmailSubject = `Booking Confirmation #${data.bookingId} - Aapka Tourism`;
    const internalEmailSubject = `New Booking #${data.bookingId} - ${formatCurrency(data.paymentAmount, data.paymentCurrency)}`;

    console.log(`📧 [EMAIL] Preparing to send emails...`);
    console.log(`📧 [EMAIL] Customer email: ${customerEmail}`);
    console.log(`📧 [EMAIL] Internal email: ${internalRecipientEmail}`);

    const results: {
      customerEmailId?: string;
      internalEmailId?: string;
      errors?: string[];
    } = {};
    const errors: string[] = [];

    // Send email to customer
    if (customerEmail) {
      try {
        console.log(
          `📧 [EMAIL] Sending customer confirmation email to: ${customerEmail}`
        );
        const customerEmailResult = await resend.emails.send({
          from: 'Aapka Tourism <noreply@aapkatourism.com>',
          to: customerEmail,
          subject: customerEmailSubject,
          html: getCustomerEmailTemplate(data),
        });

        results.customerEmailId = customerEmailResult.data?.id;
        console.log(
          `✅ [EMAIL] Customer booking confirmation email sent successfully!`
        );
        console.log(`✅ [EMAIL] Customer Email ID: ${results.customerEmailId}`);
      } catch (customerError: any) {
        const errorMsg = `Failed to send customer email: ${customerError.message}`;
        console.error(`❌ [EMAIL] ${errorMsg}`);
        errors.push(errorMsg);
      }
    } else {
      const errorMsg = 'Customer email not provided';
      console.error(`❌ [EMAIL] ${errorMsg}`);
      errors.push(errorMsg);
    }

    // Send email to internal team
    try {
      console.log(
        `📧 [EMAIL] Sending internal notification email to: ${internalRecipientEmail}`
      );
      const internalEmailResult = await resend.emails.send({
        from: 'Aapka Tourism <noreply@aapkatourism.com>',
        to: internalRecipientEmail,
        subject: internalEmailSubject,
        html: getInternalEmailTemplate(data),
      });

      results.internalEmailId = internalEmailResult.data?.id;
      console.log(
        `✅ [EMAIL] Internal booking notification email sent successfully!`
      );
      console.log(`✅ [EMAIL] Internal Email ID: ${results.internalEmailId}`);
    } catch (internalError: any) {
      const errorMsg = `Failed to send internal email: ${internalError.message}`;
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
