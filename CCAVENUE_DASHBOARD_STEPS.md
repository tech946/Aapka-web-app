# CCAvenue Dashboard - URL Registration Steps

## Where to Register Redirect URL

### Method 1: Through CCAvenue M.A.R.S. Dashboard

1. **Login to CCAvenue M.A.R.S.**
   - Go to: https://mars.ccavenue.com/ (or your CCAvenue merchant portal)
   - Login with your merchant credentials

2. **Navigate to Settings**
   - Look for **Settings** or **Configuration** in the left menu
   - Click on **Gateway Settings** or **API Settings**

3. **Find Web Store URL Section**
   - Look for fields like:
     - **Web Store URL**
     - **Return URL**
     - **Redirect URL**
     - **Callback URL**

4. **Register Your URLs**

   **For Localhost Testing:**

   ```
   http://localhost:3000
   ```

   **For Production:**

   ```
   https://www.aapkatourism.com
   ```

5. **Save the Settings**

### Method 2: Contact CCAvenue Support (Recommended for Localhost)

Since you're testing on `localhost:3000`, you **MUST** contact CCAvenue support to whitelist it:

**Email Template:**

```
To: support@ccavenue.com
Subject: URL Whitelisting Request for Merchant ID 54983

Dear CCAvenue Support Team,

I need to whitelist the following URLs for testing my payment gateway integration:

Merchant ID: 54983
Merchant Name: Aapka Tourism

Testing URLs to whitelist:
1. http://localhost:3000
2. http://localhost:3000/api/payments/ccavenue/callback

Production URLs (if applicable):
1. https://www.aapkatourism.com
2. https://www.aapkatourism.com/api/payments/ccavenue/callback

Please whitelist these URLs so I can test the payment integration.

Thank you.
```

### Method 3: Check Your CCAvenue Dashboard Location

The exact location varies by CCAvenue version. Look for:

- **Settings** → **Gateway Settings** → **Web Store URL**
- **Settings** → **API Configuration** → **Return URL**
- **Integration** → **Settings** → **URL Configuration**
- **Merchant Settings** → **Payment Gateway** → **URL Settings**

### Important Notes:

1. **URL Must Match Exactly**:
   - If you register `http://localhost:3000`, your code must use exactly that
   - No trailing slashes
   - Case sensitive

2. **Wait Time**:
   - After registering, wait 5-10 minutes for changes to take effect

3. **Localhost Limitation**:
   - Many payment gateways don't allow localhost by default
   - You MUST contact support to whitelist localhost for testing

4. **Alternative for Testing**:
   - Use a staging/production domain if you have one
   - Or use ngrok/tunneling service to create a public URL for localhost

### Quick Checklist:

- [ ] Logged into CCAvenue dashboard
- [ ] Found Settings → Gateway Settings
- [ ] Registered `http://localhost:3000` (or contacted support)
- [ ] Registered callback URL: `http://localhost:3000/api/payments/ccavenue/callback`
- [ ] Saved settings
- [ ] Waited 5-10 minutes
- [ ] Restarted dev server
- [ ] Tried payment again

### Still Having Issues?

If you can't find the URL registration option:

1. Take a screenshot of your CCAvenue dashboard
2. Contact CCAvenue support: support@ccavenue.com
3. Ask them: "Where do I register the redirect URL for my merchant account?"
