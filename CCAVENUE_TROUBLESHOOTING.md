# CCAvenue Error 10002 - Troubleshooting Guide

## Error: "10002 - Merchant Authentication failed"

This error typically occurs due to one of the following reasons:

### 1. **Check Your Environment Variables**

Make sure your `.env.local` file has the correct credentials:

```env
CCAVENUE_MERCHANT_ID=54983
CCAVENUE_ACCESS_CODE=AVLG05MJ58AS49GLSA
CCAVENUE_WORKING_KEY=5E25D58B6BF1633A1525984EB4E2E944
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important**:

- Make sure there are no extra spaces
- Make sure the values match exactly from your CCAvenue dashboard
- Restart your Next.js dev server after adding/updating `.env.local`

### 2. **URL Registration in CCAvenue**

The redirect URL must be registered in your CCAvenue account:

1. Log into your CCAvenue merchant dashboard
2. Go to **Settings** > **Gateway Settings**
3. Check the **Web Store URL** field
4. Make sure it matches your `NEXT_PUBLIC_APP_URL`

**For Testing on Localhost:**

- You need to contact CCAvenue support to whitelist `http://localhost:3000`
- Or use your production domain if you have one registered

### 3. **Check Encryption Key**

The Encryption Key from your dashboard is the same as the Working Key. Make sure:

- You're using the correct key: `5E25D58B6BF1633A1525984EB4E2E944`
- No extra spaces or characters
- The key is exactly 32 characters (hex)

### 4. **Test vs Production Environment**

- If you're using **test/sandbox** credentials, make sure you're using the test payment URL
- If you're using **production** credentials, make sure you're using the production URL

### 5. **Check Server Logs**

Check your terminal/console for any error messages. The code now logs:

- Whether credentials are loaded
- Encryption errors (if any)

### 6. **Verify Credentials in CCAvenue Dashboard**

1. Log into CCAvenue dashboard
2. Go to **Settings** > **API Keys**
3. Verify:
   - Merchant ID: `54983`
   - Access Code: `AVLG05MJ58AS49GLSA`
   - Encryption Key: `5E25D58B6BF1633A1525984EB4E2E944`

### 7. **Contact CCAvenue Support**

If all above checks pass, contact CCAvenue support:

- Email: support@ccavenue.com
- Provide your Merchant ID: `54983`
- Mention you're testing on localhost (if applicable)
- Request whitelisting of your testing URL

## Quick Checklist

- [ ] Environment variables are set correctly in `.env.local`
- [ ] Dev server was restarted after adding env variables
- [ ] Redirect URL is registered in CCAvenue dashboard
- [ ] Using correct test/production credentials
- [ ] No extra spaces in credentials
- [ ] Contacted CCAvenue to whitelist localhost (if testing locally)
