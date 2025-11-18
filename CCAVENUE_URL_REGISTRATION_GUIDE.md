# CCAvenue URL Registration Guide

## How to Register Redirect URL in CCAvenue Dashboard

### Step-by-Step Instructions:

1. **Log into CCAvenue Merchant Dashboard**
   - Go to: https://merchant.ccavenue.com/
   - Login with your merchant credentials

2. **Navigate to Gateway Settings**
   - Click on **Settings** in the left sidebar
   - Select **Gateway Settings** or **API Settings**
   - Look for **Web Store URL** or **Redirect URL** section

3. **Register Your URLs**
   You need to register these URLs:

   **For Testing (Localhost):**

   ```
   http://localhost:3000
   ```

   **For Production:**

   ```
   https://www.aapkatourism.com
   ```

   (Replace with your actual domain)

4. **Add Callback URL**
   - Also register the full callback URL:

   ```
   http://localhost:3000/api/payments/ccavenue/callback
   ```

   Or for production:

   ```
   https://www.aapkatourism.com/api/payments/ccavenue/callback
   ```

5. **Save Settings**
   - Click **Save** or **Update**
   - Wait a few minutes for changes to take effect

### Alternative: Contact CCAvenue Support

If you can't find the URL registration option:

1. **Email CCAvenue Support**
   - Email: support@ccavenue.com
   - Subject: "Request to whitelist URL for testing"
2. **Include in Email:**
   - Your Merchant ID: `54983`
   - Testing URL: `http://localhost:3000`
   - Callback URL: `http://localhost:3000/api/payments/ccavenue/callback`
   - Request: "Please whitelist these URLs for testing purposes"

3. **For Production:**
   - Provide your production domain
   - Request whitelisting of production URLs

### Important Notes:

- **URL Must Match Exactly**: The URL in your code must match exactly what's registered (including http/https)
- **No Trailing Slash**: Make sure URLs don't have trailing slashes
- **Wait for Activation**: After registering, wait 5-10 minutes for changes to take effect
- **Test Environment**: For localhost testing, you MUST contact CCAvenue support to whitelist it

### Quick Check:

After registering, verify:

1. The URL in your `.env.local` matches the registered URL
2. Restart your dev server
3. Try the payment again

### If Still Getting Error 10002:

1. Double-check credentials are correct
2. Verify URL is registered (contact support if needed)
3. Check if you're using test vs production credentials
4. Make sure no extra spaces in environment variables
