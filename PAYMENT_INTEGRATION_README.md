# Payment Integration Guide

This document explains the payment integration system that supports HDFC (for Indian users) and CCAvenue (for non-Indian users) with partial payment options.

## Features

1. **Automatic Location Detection**: Detects user location using IP geolocation
2. **Location-Based Gateway Selection**:
   - **India**: HDFC payment gateway with INR currency
   - **Outside India**: CCAvenue payment gateway with INR currency
3. **Partial Payment Support**: Users can choose between:
   - Full payment (100%)
   - Half payment (50%)

## Setup Instructions

### 1. Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# HDFC Configuration (for Indian users)
HDFC_MERCHANT_ID=your_hdfc_merchant_id
HDFC_ACCESS_CODE=your_hdfc_access_code
HDFC_WORKING_KEY=your_hdfc_working_key
HDFC_PAYMENT_URL=https://securepg.hdfcbank.com/payment/merchant/request

# CCAvenue Configuration (for non-Indian users)
CCAVENUE_MERCHANT_ID=your_ccavenue_merchant_id
CCAVENUE_ACCESS_CODE=your_ccavenue_access_code
CCAVENUE_WORKING_KEY=your_ccavenue_working_key
CCAVENUE_PAYMENT_URL=https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction

# Application URL (for payment callbacks)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Exchange Rate (AED to INR)
# Update this in src/lib/location-utils.ts or fetch from an API
```

### 2. Database Migration

Run the database migration to add payment fields:

```sql
-- Run this SQL in your Supabase SQL editor
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS payment_amount_currency TEXT DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS payment_type TEXT CHECK (payment_type IN ('half', 'full')),
ADD COLUMN IF NOT EXISTS payment_gateway TEXT CHECK (payment_gateway IN ('hdfc', 'ccavenue')),
ADD COLUMN IF NOT EXISTS payment_done TEXT CHECK (payment_done IN ('half', 'full'));
```

Or use the migration file: `supabase_bookings_payment_fields_migration.sql`

### 3. HDFC Setup

1. Sign up at [HDFC Bank Payment Gateway](https://www.hdfcbank.com/personal/pay/payment-solutions/smarthub)
2. Complete KYC and merchant registration
3. Get your Merchant ID, Access Code, and Working Key from HDFC
4. Add credentials to environment variables

**Note**: HDFC encryption uses AES-128-CBC. The current implementation uses AES encryption. For production, verify the exact encryption method with HDFC support team.

### 4. CCAvenue Setup

1. Sign up at [CCAvenue](https://www.ccavenue.com/)
2. Complete KYC process
3. Get your Merchant ID, Access Code, and Working Key
4. Add credentials to environment variables

**Note**: CCAvenue encryption uses AES-128-CBC. The current implementation uses a basic AES encryption. For production, consider using CCAvenue's official encryption library or verify the exact encryption method with their support team.

## How It Works

### Payment Flow

1. **User Location Detection**: On checkout page load, the system detects user location via IP geolocation
2. **Currency Conversion**: AED amounts are converted to INR using the exchange rate
3. **Payment Type Selection**: User selects full or half payment
4. **Booking Creation**: Booking is created with payment details
5. **Payment Gateway Initialization**:
   - **HDFC**: Redirects to HDFC payment page
   - **CCAvenue**: Redirects to CCAvenue payment page
6. **Payment Verification**: After payment, the system verifies and updates the booking

### API Endpoints

#### HDFC

- `POST /api/payments/hdfc/create-order` - Creates HDFC order
- `POST /api/payments/hdfc/callback` - Handles HDFC payment callback (POST)
- `GET /api/payments/hdfc/callback` - Handles HDFC payment callback (GET)

#### CCAvenue

- `POST /api/payments/ccavenue/create-order` - Creates CCAvenue order
- `GET /api/payments/ccavenue/callback` - Handles CCAvenue payment callback

### Database Fields

The booking table stores:

- `payment_amount`: Amount paid in INR
- `payment_amount_currency`: Currency (INR)
- `payment_type`: 'half' or 'full' (what user selected)
- `payment_gateway`: 'hdfc' or 'ccavenue'
- `payment_done`: 'half' or 'full' (actual payment status)
- `payment_status`: 'pending', 'completed', 'failed', 'refunded'
- `payment_transaction_id`: Transaction ID from gateway

## Testing

### HDFC Test Mode

- Use HDFC test credentials
- Test in sandbox/test environment provided by HDFC

### CCAvenue Test Mode

- Use CCAvenue test credentials
- Test in sandbox environment

## Important Notes

1. **Exchange Rate**: The AED to INR conversion rate is hardcoded in `src/lib/location-utils.ts`. For production, consider fetching real-time rates from an API.

2. **CCAvenue Encryption**: The current AES encryption implementation may need adjustment based on CCAvenue's exact requirements. Contact CCAvenue support for their official encryption method.

3. **Security**: Never expose API secrets in client-side code. All sensitive operations are handled server-side.

4. **Error Handling**: The system includes error handling for payment failures, but ensure you have proper logging and monitoring in place.

5. **Partial Payments**: When a user makes a half payment, the booking status remains 'pending' until full payment is completed. You may want to add logic to track partial payments and allow users to complete the remaining payment.

## Support

For issues or questions:

- HDFC: Contact HDFC Bank Merchant Helpdesk
- CCAvenue: Contact their support team directly
