# Environment Variables Setup Guide

## CCAvenue Configuration (for non-Indian users)

Based on your CCAvenue dashboard, add these to your `.env.local` file:

```env
# CCAvenue Configuration (for non-Indian users)
CCAVENUE_MERCHANT_ID=54983
CCAVENUE_ACCESS_CODE=AVLG05MJ58AS49GLSA
CCAVENUE_WORKING_KEY=5E25D58B6BF1633A1525984EB4E2E944
CCAVENUE_PAYMENT_URL=https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction
```

## HDFC Configuration (for Indian users)

You'll need to get these from HDFC Bank:

```env
# HDFC Configuration (for Indian users)
HDFC_MERCHANT_ID=your_hdfc_merchant_id
HDFC_ACCESS_CODE=your_hdfc_access_code
HDFC_WORKING_KEY=your_hdfc_working_key
HDFC_PAYMENT_URL=https://securepg.hdfcbank.com/payment/merchant/request
```

## Application Configuration

```env
# Application URL (for payment callbacks)
# For local development:
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For production, use your actual domain:
# NEXT_PUBLIC_APP_URL=https://www.aapkatourism.com
```

## Important Notes

1. **All CCAvenue credentials are required** - Merchant ID, Access Code, and Working Key (Encryption Key)
2. **Working Key = Encryption Key** - They're the same thing in CCAvenue
3. **Never commit `.env.local` to git** - It contains sensitive credentials
4. **Payment URL is optional** - It has a default value, but you can override it if needed

## How to Get HDFC Credentials

1. Sign up at [HDFC Bank Payment Gateway](https://www.hdfcbank.com/personal/pay/payment-solutions/smarthub)
2. Complete merchant registration and KYC
3. Get your credentials from the HDFC merchant dashboard
4. Add them to `.env.local` as shown above
