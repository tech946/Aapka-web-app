// Resend email functionality temporarily disabled
// import { Resend } from 'resend';

// Initialize Resend only if API key is available
// const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const resend: any = null;

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
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
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
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                ✈️ Booking Confirmed!
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                Thank you for choosing Aapka Tourism
              </p>
            </td>
          </tr>

          <!-- Booking ID Section -->
          <tr>
            <td style="padding: 30px 30px 20px 30px; background-color: #ffffff;">
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px 20px; border-radius: 6px;">
                <p style="margin: 0; color: #6c757d; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                  Booking Reference
                </p>
                <p style="margin: 8px 0 0 0; color: #212529; font-size: 24px; font-weight: 700; letter-spacing: 1px;">
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
                  <td style="padding: 8px 0; color: #6c757d; font-size: 14px; width: 140px;">Name:</td>
                  <td style="padding: 8px 0; color: #212529; font-size: 14px; font-weight: 500;">${data.customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Email:</td>
                  <td style="padding: 8px 0; color: #212529; font-size: 14px; font-weight: 500;">${data.customerEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Phone:</td>
                  <td style="padding: 8px 0; color: #212529; font-size: 14px; font-weight: 500;">${data.customerPhone}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">WhatsApp:</td>
                  <td style="padding: 8px 0; color: #212529; font-size: 14px; font-weight: 500;">${data.customerWhatsApp}</td>
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
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 15px; border: 1px solid #e9ecef;">
                <h3 style="margin: 0 0 10px 0; color: #667eea; font-size: 18px; font-weight: 600;">
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
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; border: 1px solid #e9ecef;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Total Amount:</td>
                    <td style="padding: 8px 0; color: #212529; font-size: 14px; font-weight: 600; text-align: right;">${formatCurrency(data.totalAmount, data.paymentCurrency)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Payment Type:</td>
                    <td style="padding: 8px 0; color: #212529; font-size: 14px; font-weight: 500; text-align: right; text-transform: capitalize;">${data.paymentType}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Amount Paid:</td>
                    <td style="padding: 8px 0; color: #28a745; font-size: 16px; font-weight: 700; text-align: right;">${formatCurrency(data.paymentAmount, data.paymentCurrency)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Transaction ID:</td>
                    <td style="padding: 8px 0; color: #212529; font-size: 13px; font-weight: 500; text-align: right; font-family: monospace;">${data.paymentTransactionId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6c757d; font-size: 14px;">Payment Status:</td>
                    <td style="padding: 8px 0; text-align: right;">
                      <span style="background-color: #28a745; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
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
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 15px; border: 1px solid #e9ecef;">
                <h3 style="margin: 0 0 12px 0; color: #667eea; font-size: 16px; font-weight: 600;">
                  ${index === 0 ? 'Lead Passenger' : `Passenger ${index + 1}`}
                </h3>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 5px 0; color: #6c757d; font-size: 13px; width: 140px;">Name:</td>
                    <td style="padding: 5px 0; color: #212529; font-size: 13px; font-weight: 500;">${passenger.salutation} ${passenger.firstName} ${passenger.lastName}</td>
                  </tr>
                  ${
                    index === 0
                      ? `
                  <tr>
                    <td style="padding: 5px 0; color: #6c757d; font-size: 13px;">Email:</td>
                    <td style="padding: 5px 0; color: #212529; font-size: 13px; font-weight: 500;">${passenger.email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; color: #6c757d; font-size: 13px;">Phone:</td>
                    <td style="padding: 5px 0; color: #212529; font-size: 13px; font-weight: 500;">${passenger.phone}</td>
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
                    <td style="padding: 5px 0; color: #6c757d; font-size: 13px;">Address:</td>
                    <td style="padding: 5px 0; color: #212529; font-size: 13px; font-weight: 500;">${passenger.permanentAddress}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; color: #6c757d; font-size: 13px;">Passport Expiry:</td>
                    <td style="padding: 5px 0; color: #212529; font-size: 13px; font-weight: 500;">${formatDate(passenger.passportExpiry)}</td>
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
            <td style="padding: 30px; background-color: #f8f9fa; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 14px; line-height: 1.6;">
                If you have any questions or need assistance, please don't hesitate to contact us.
              </p>
              <p style="margin: 0; color: #6c757d; font-size: 13px;">
                <strong>Aapka Tourism</strong><br>
                Email: info@aapkatourism.com<br>
                We're here to make your journey memorable!
              </p>
              <p style="margin: 20px 0 0 0; color: #adb5bd; font-size: 12px;">
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
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
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
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 700px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Alert Style -->
          <tr>
            <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                🎉 New Booking Received!
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                Action Required - Booking #${data.bookingId}
              </p>
            </td>
          </tr>

          <!-- Booking Alert Box -->
          <tr>
            <td style="padding: 30px 30px 20px 30px; background-color: #ffffff;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 20px; text-align: center;">
                <p style="margin: 0; color: #ffffff; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                  Booking Reference
                </p>
                <p style="margin: 8px 0 0 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: 2px;">
                  ${data.bookingId}
                </p>
                <p style="margin: 15px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 18px; font-weight: 600;">
                  ${formatCurrency(data.paymentAmount, data.paymentCurrency)} Paid
                </p>
              </div>
            </td>
          </tr>

          <!-- Customer Information -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <h2 style="margin: 0 0 15px 0; color: #212529; font-size: 20px; font-weight: 600; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">
                👤 Customer Details
              </h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; color: #6c757d; font-size: 14px; width: 150px; font-weight: 600;">Full Name:</td>
                  <td style="padding: 10px 0; color: #212529; font-size: 15px; font-weight: 600;">${data.customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6c757d; font-size: 14px; font-weight: 600;">Email:</td>
                  <td style="padding: 10px 0;">
                    <a href="mailto:${data.customerEmail}" style="color: #667eea; font-size: 15px; font-weight: 500; text-decoration: none;">${data.customerEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6c757d; font-size: 14px; font-weight: 600;">Phone:</td>
                  <td style="padding: 10px 0;">
                    <a href="tel:${data.customerPhone}" style="color: #212529; font-size: 15px; font-weight: 500; text-decoration: none;">${data.customerPhone}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6c757d; font-size: 14px; font-weight: 600;">WhatsApp:</td>
                  <td style="padding: 10px 0;">
                    <a href="https://wa.me/${data.customerWhatsApp.replace(/[^0-9]/g, '')}" style="color: #25d366; font-size: 15px; font-weight: 500; text-decoration: none;">${data.customerWhatsApp}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #6c757d; font-size: 14px; font-weight: 600;">Booking Date:</td>
                  <td style="padding: 10px 0; color: #212529; font-size: 15px; font-weight: 500;">${formatDate(data.bookingDate)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Package Details -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <h2 style="margin: 0 0 15px 0; color: #212529; font-size: 20px; font-weight: 600; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">
                📦 Package Information
              </h2>
              ${data.packages
                .map(
                  (pkg, index) => `
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; border-radius: 6px; padding: 20px; margin-bottom: 15px;">
                <h3 style="margin: 0 0 12px 0; color: #667eea; font-size: 18px; font-weight: 700;">
                  ${pkg.packageName}
                </h3>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6c757d; font-size: 14px; width: 150px; font-weight: 600;">Package ID:</td>
                    <td style="padding: 8px 0; color: #212529; font-size: 14px; font-family: monospace;">${pkg.packageId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6c757d; font-size: 14px; font-weight: 600;">Travel Date:</td>
                    <td style="padding: 8px 0; color: #212529; font-size: 14px; font-weight: 500;">${formatDate(pkg.selectedDate)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6c757d; font-size: 14px; font-weight: 600;">Passengers:</td>
                    <td style="padding: 8px 0; color: #212529; font-size: 14px; font-weight: 500;">
                      ${pkg.adults} Adult${pkg.adults !== 1 ? 's' : ''}
                      ${pkg.children > 0 ? `, ${pkg.children} Child${pkg.children !== 1 ? 'ren' : ''}` : ''}
                      ${pkg.infants && pkg.infants > 0 ? `, ${pkg.infants} Infant${pkg.infants !== 1 ? 's' : ''}` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6c757d; font-size: 14px; font-weight: 600;">Package Price:</td>
                    <td style="padding: 8px 0; color: #212529; font-size: 16px; font-weight: 700;">${formatCurrency(pkg.price, data.paymentCurrency)}</td>
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
            <td style="padding: 0 30px 20px 30px;">
              <h2 style="margin: 0 0 15px 0; color: #212529; font-size: 20px; font-weight: 600; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">
                💳 Payment Details
              </h2>
              <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 20px;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; color: #856404; font-size: 15px; font-weight: 700; width: 200px;">Total Booking Amount:</td>
                    <td style="padding: 10px 0; color: #856404; font-size: 18px; font-weight: 700; text-align: right;">${formatCurrency(data.totalAmount, data.paymentCurrency)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #856404; font-size: 15px; font-weight: 600;">Payment Type:</td>
                    <td style="padding: 10px 0; color: #856404; font-size: 15px; font-weight: 500; text-align: right; text-transform: capitalize;">${data.paymentType}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #856404; font-size: 15px; font-weight: 600;">Amount Received:</td>
                    <td style="padding: 10px 0; color: #28a745; font-size: 20px; font-weight: 700; text-align: right;">${formatCurrency(data.paymentAmount, data.paymentCurrency)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #856404; font-size: 14px; font-weight: 600;">Transaction ID:</td>
                    <td style="padding: 10px 0; color: #856404; font-size: 14px; font-weight: 500; text-align: right; font-family: monospace;">${data.paymentTransactionId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #856404; font-size: 14px; font-weight: 600;">Payment Gateway:</td>
                    <td style="padding: 10px 0; color: #856404; font-size: 14px; font-weight: 500; text-align: right; text-transform: uppercase;">${data.paymentGateway}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; color: #856404; font-size: 14px; font-weight: 600;">Payment Status:</td>
                    <td style="padding: 10px 0; text-align: right;">
                      <span style="background-color: #28a745; color: #ffffff; padding: 6px 16px; border-radius: 16px; font-size: 13px; font-weight: 700; text-transform: uppercase;">
                        ✓ ${data.paymentStatus}
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
              <h2 style="margin: 0 0 15px 0; color: #212529; font-size: 20px; font-weight: 600; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">
                👥 Passenger Details
              </h2>
              ${data.passengers
                .map(
                  (passenger, index) => `
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 15px; border: 1px solid #e9ecef;">
                <h3 style="margin: 0 0 12px 0; color: #667eea; font-size: 16px; font-weight: 700;">
                  ${index === 0 ? '👤 Lead Passenger' : `👤 Passenger ${index + 1}`}
                </h3>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; color: #6c757d; font-size: 13px; width: 150px; font-weight: 600;">Full Name:</td>
                    <td style="padding: 6px 0; color: #212529; font-size: 14px; font-weight: 500;">${passenger.salutation} ${passenger.firstName} ${passenger.lastName}</td>
                  </tr>
                  ${
                    index === 0
                      ? `
                  <tr>
                    <td style="padding: 6px 0; color: #6c757d; font-size: 13px; font-weight: 600;">Email:</td>
                    <td style="padding: 6px 0; color: #212529; font-size: 14px; font-weight: 500;">${passenger.email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #6c757d; font-size: 13px; font-weight: 600;">Phone:</td>
                    <td style="padding: 6px 0; color: #212529; font-size: 14px; font-weight: 500;">${passenger.phone}</td>
                  </tr>
                  `
                      : ''
                  }
                  <tr>
                    <td style="padding: 6px 0; color: #6c757d; font-size: 13px; font-weight: 600;">Country:</td>
                    <td style="padding: 6px 0; color: #212529; font-size: 14px; font-weight: 500;">${passenger.country}</td>
                  </tr>
                  ${
                    passenger.nationality
                      ? `
                  <tr>
                    <td style="padding: 6px 0; color: #6c757d; font-size: 13px; font-weight: 600;">Nationality:</td>
                    <td style="padding: 6px 0; color: #212529; font-size: 14px; font-weight: 500;">${passenger.nationality}</td>
                  </tr>
                  `
                      : ''
                  }
                  ${
                    passenger.pickupLocation
                      ? `
                  <tr>
                    <td style="padding: 6px 0; color: #6c757d; font-size: 13px; font-weight: 600;">Pickup Location:</td>
                    <td style="padding: 6px 0; color: #212529; font-size: 14px; font-weight: 500;">${passenger.pickupLocation}</td>
                  </tr>
                  `
                      : ''
                  }
                  <tr>
                    <td style="padding: 6px 0; color: #6c757d; font-size: 13px; font-weight: 600;">Address:</td>
                    <td style="padding: 6px 0; color: #212529; font-size: 14px; font-weight: 500;">${passenger.permanentAddress}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #6c757d; font-size: 13px; font-weight: 600;">Passport Expiry:</td>
                    <td style="padding: 6px 0; color: #212529; font-size: 14px; font-weight: 500;">${formatDate(passenger.passportExpiry)}</td>
                  </tr>
                </table>
              </div>
              `
                )
                .join('')}
            </td>
          </tr>

          <!-- Action Footer -->
          <tr>
            <td style="padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); text-align: center;">
              <p style="margin: 0 0 15px 0; color: #ffffff; font-size: 16px; font-weight: 600;">
                ⚡ Action Required
              </p>
              <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; line-height: 1.6;">
                Please review this booking and take necessary actions. Contact the customer if needed.
              </p>
              <p style="margin: 20px 0 0 0; color: rgba(255, 255, 255, 0.8); font-size: 12px;">
                This is an automated notification from Aapka Tourism booking system.
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
  try {
    // Email functionality temporarily disabled
    if (!resend || !process.env.RESEND_API_KEY) {
      console.log('Email service is disabled - RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured' };
    }

    // Send to customer
    const customerEmailResult = await resend.emails.send({
      from: 'Aapka Tourism <noreply@aapkatourism.com>',
      to: data.customerEmail,
      subject: `Booking Confirmed - ${data.bookingId} | Aapka Tourism`,
      html: getCustomerEmailTemplate(data),
    });

    // Send to internal team
    const internalEmails = ['info@aapkatourism.com', 'sam@aapkatourism.com'];
    const internalEmailResult = await resend.emails.send({
      from: 'Aapka Tourism <noreply@aapkatourism.com>',
      to: internalEmails,
      subject: `🎉 New Booking #${data.bookingId} - ${formatCurrency(data.paymentAmount, data.paymentCurrency)}`,
      html: getInternalEmailTemplate(data),
    });

    return {
      success: true,
      customerEmailId: customerEmailResult.data?.id,
      internalEmailId: internalEmailResult.data?.id,
    };
  } catch (error: any) {
    console.error('Error sending booking confirmation emails:', error);
    return {
      success: false,
      error: error.message || 'Failed to send emails',
    };
  }
}
