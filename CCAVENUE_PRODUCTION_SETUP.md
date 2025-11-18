# CCAvenue Production Setup Guide

## For Live HTTPS Domain

### Step 1: Register Your Production URLs

✅ **Your URL is already registered!**

- Current registered URL: `http://WWW.AAPKATOURISM.COM`

**Important Notes:**

- If you're using **HTTPS** in production, you need to **add HTTPS URL** as well:
  - Update the Web Store URL field to: `https://www.aapkatourism.com`
  - Or add both HTTP and HTTPS if you support both

- The registered URL should match your production domain exactly
- CCAvenue validates the base domain, so the callback URL (`/api/payments/ccavenue/callback`) should work automatically

**To Update/Add HTTPS URL:**

1. Login to CCAvenue Dashboard
2. Go to **Settings** → **Gateway Settings** → **Web Store URL**
3. Update the URL to: `https://www.aapkatourism.com` (if using HTTPS)
4. Click **Save**
5. Wait 5-10 minutes for changes to take effect

### Step 2: Update Environment Variables

In your production environment (Vercel, etc.), set:

```env
NEXT_PUBLIC_APP_URL=https://www.aapkatourism.com
# or
NEXT_PUBLIC_SITE_URL=https://www.aapkatourism.com

CCAVENUE_MERCHANT_ID=54983
CCAVENUE_ACCESS_CODE=AVLG05MJ58AS49GLSA
CCAVENUE_WORKING_KEY=5E25D58B6BF1633A1525984EB4E2E944
CCAVENUE_PAYMENT_URL=https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction
```

### Step 3: Test the Integration

1. Deploy your app to production
2. Make a test payment
3. Verify the redirect works correctly

## Important Notes

### ✅ What Works Automatically:

- The encryption/decryption code will work
- The payment gateway will process payments
- HTTPS is automatically supported

### ❌ What Doesn't Work Automatically:

- **Redirect URL validation** - Must be registered in dashboard
- **Domain whitelisting** - Must match registered domain exactly

### Key Differences: Localhost vs Production

| Aspect           | Localhost            | Production HTTPS               |
| ---------------- | -------------------- | ------------------------------ |
| URL Registration | Must contact support | Can register in dashboard      |
| Setup Time       | 1-2 business days    | Immediate (after registration) |
| Testing          | Limited              | Full testing available         |
| Support Required | Yes                  | No                             |

## Troubleshooting

### If Payment Redirect Fails:

1. **Check URL Registration**
   - Verify the exact URL is registered (including https://)
   - No trailing slashes
   - Must match exactly what's in your code

2. **Check Environment Variables**
   - Ensure `NEXT_PUBLIC_APP_URL` is set correctly
   - Restart your application after changing env vars

3. **Verify Domain Match**
   - The domain in your code must match the registered domain
   - Check for www vs non-www differences

### Common Issues:

- **Error 10002**: URL not registered or doesn't match
- **Redirect fails**: Check callback URL is registered
- **Payment processes but redirect fails**: Verify redirect URL in dashboard

## Quick Checklist for Production:

- [ ] Registered production domain in CCAvenue dashboard
- [ ] Registered callback URL: `https://yourdomain.com/api/payments/ccavenue/callback`
- [ ] Set `NEXT_PUBLIC_APP_URL` in production environment
- [ ] All CCAvenue credentials are set in production env vars
- [ ] Tested a payment in production
- [ ] Verified redirect works after payment

## Support

If you can't find the URL registration option in your dashboard:

- Email: support@ccavenue.com
- Include: Merchant ID, Domain, Callback URL
- Request: "Please register these URLs for my production environment"
