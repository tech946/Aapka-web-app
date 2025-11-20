# CCAvenue Integration - Critical Setup Requirements

## ⚠️ CRITICAL: Domain Registration (MUST DO FIRST!)

According to the official guide you provided:

> **"You must first register your local URL and Production/Stage domain with CCAvenue. You can add your URLs to use and access APIs and process payments by contacting CCAvenue's Customer Help Center."**

### This means:

1. **You CANNOT register URLs in the dashboard**
2. **You MUST contact CCAvenue Customer Help Center**
3. **You need to register BOTH:**
   - Local/Development URL (e.g., `http://localhost:3000`)
   - Production URL (e.g., `https://yourdomain.com`)

### Steps:

1. Contact CCAvenue Customer Help Center
2. Request domain registration for your merchant account
3. Provide them with:
   - Your Merchant ID
   - Local URL: `http://localhost:3000` (for testing)
   - Production URL: `https://yourdomain.com` (your actual domain)
4. Wait for confirmation that domains are registered

**Without this step, you will ALWAYS get Error 10002 (Merchant Authentication failed)**

---

## Error 10002 - Possible Causes

According to CCAvenue documentation, Error 10002 can be caused by:

1. ❌ **Incorrect Merchant ID**
2. ❌ **Incorrect Access Code**
3. ❌ **Order originating from unregistered URL** ← **THIS IS LIKELY YOUR ISSUE**

---

## Verification Checklist

### 1. Verify API Credentials

- Go to: **Settings → API Keys** in CCAvenue MARS
- Verify:
  - ✅ Merchant ID matches `CCAVENUE_MERCHANT_ID` in your `.env`
  - ✅ Access Code matches `CCAVENUE_ACCESS_CODE` in your `.env`
  - ✅ Working Key (Encryption Key) matches `CCAVENUE_WORKING_KEY` in your `.env`

### 2. Verify Domain Registration

- ✅ Contacted CCAvenue Customer Help Center
- ✅ Received confirmation that your domain is registered
- ✅ Both local and production URLs are registered

### 3. Verify Domain (.com vs .ae)

- ✅ Check if you should use:
  - `https://secure.ccavenue.com` (India)
  - `https://secure.ccavenue.ae` (UAE)
- ✅ Set `CCAVENUE_USE_UAE=true` in `.env` if using UAE account

### 4. Verify Redirect URL

- ✅ Your redirect URL: `https://yourdomain.com/api/payments/ccavenue/callback`
- ✅ This URL should be accessible (not blocked by firewall)
- ✅ This URL should handle POST requests

---

## Testing Your Integration

### Test Encryption

Visit: `http://localhost:3000/api/payments/ccavenue/test-encryption`

This will verify:

- ✅ Encryption/Decryption is working
- ✅ Credentials are configured
- ✅ No issues with the crypto implementation

### Check Server Logs

When you try to make a payment, check your server console logs. You should see:

- Plain text being encrypted
- Encrypted data
- Payment URL being generated
- Debug information

---

## Common Issues & Solutions

### Issue: Still getting Error 10002 after domain registration

**Solution:**

1. Double-check Merchant ID, Access Code, and Working Key are correct
2. Verify you're using the correct domain (.com vs .ae)
3. Wait 24-48 hours after domain registration (sometimes takes time to propagate)
4. Try with localhost first, then production

### Issue: Encryption works but payment fails

**Solution:**

1. Check if redirect URL is accessible
2. Verify callback handler is working: `/api/payments/ccavenue/callback`
3. Check server logs for callback errors

### Issue: Wrong domain (.com vs .ae)

**Solution:**

- Check your CCAvenue account type (India vs UAE)
- Set `CCAVENUE_USE_UAE=true` in `.env` if using UAE account
- Or set `CCAVENUE_PAYMENT_URL` directly in `.env`

---

## Environment Variables Required

```env
# CCAvenue Credentials (from Settings > API Keys)
CCAVENUE_MERCHANT_ID=your_merchant_id
CCAVENUE_ACCESS_CODE=your_access_code
CCAVENUE_WORKING_KEY=your_working_key

# Domain Selection (optional)
CCAVENUE_USE_UAE=true  # Set to true if using UAE account (.ae domain)

# Or set custom payment URL
CCAVENUE_PAYMENT_URL=https://secure.ccavenue.ae/transaction/transaction.do?command=initiateTransaction

# Your app URL (for redirect URLs)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
# or
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

---

## Next Steps

1. ✅ **Contact CCAvenue Customer Help Center** to register your domain
2. ✅ Verify all credentials in Settings > API Keys
3. ✅ Test encryption: `/api/payments/ccavenue/test-encryption`
4. ✅ Try a test payment after domain registration is confirmed
5. ✅ Check server logs for detailed debug information

---

## Support

If you've done all the above and still getting errors:

1. Check CCAvenue MARS dashboard for any account restrictions
2. Verify your account is activated for API access
3. Contact CCAvenue support with:
   - Your Merchant ID
   - Error code (10002)
   - The exact error message
   - Confirmation that domain is registered
