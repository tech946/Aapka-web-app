# CCAvenue Integration - Quick Check

## ✅ Current Status

**Your URL is Registered:**

- Registered URL: `http://WWW.AAPKATOURISM.COM`
- Status: ✅ Registered in CCAvenue dashboard

## ⚠️ Important Checks Before Going Live

### 1. HTTP vs HTTPS

**Current Registration:** `http://WWW.AAPKATOURISM.COM`

**If your production site uses HTTPS:**

- ✅ **Option 1:** Update the registered URL to `https://www.aapkatourism.com`
- ✅ **Option 2:** Add both HTTP and HTTPS (if CCAvenue allows multiple URLs)

**Action Required:**

- Check if your production site uses HTTP or HTTPS
- Update the Web Store URL in CCAvenue dashboard to match

### 2. Environment Variable

Make sure your production environment has:

```env
NEXT_PUBLIC_APP_URL=http://www.aapkatourism.com
# OR if using HTTPS:
NEXT_PUBLIC_APP_URL=https://www.aapkatourism.com
```

**Important:** The URL must match the registered URL in CCAvenue dashboard (protocol must match!)

### 3. URL Format Matching

- Registered: `http://WWW.AAPKATOURISM.COM`
- Your code uses: `${NEXT_PUBLIC_APP_URL}/api/payments/ccavenue/callback`
- Make sure: `NEXT_PUBLIC_APP_URL` = `http://www.aapkatourism.com` (or https)

### 4. Test Checklist

Before going live, verify:

- [ ] URL in CCAvenue dashboard matches your production domain
- [ ] Protocol (http/https) matches between dashboard and your code
- [ ] `NEXT_PUBLIC_APP_URL` is set correctly in production
- [ ] Test a payment in production
- [ ] Verify redirect after payment works

## Will It Work?

**Yes, IF:**

1. ✅ URL is registered (you have this)
2. ✅ Environment variable matches registered URL
3. ✅ Protocol (http/https) matches

**No, IF:**

- ❌ Production uses HTTPS but dashboard has HTTP
- ❌ Environment variable doesn't match registered URL
- ❌ URL format doesn't match (www vs non-www, http vs https)

## Quick Fix for HTTPS

If your production uses HTTPS but dashboard has HTTP:

1. Go to CCAvenue Dashboard
2. Settings → Gateway Settings → Web Store URL
3. Change: `http://WWW.AAPKATOURISM.COM`
4. To: `https://www.aapkatourism.com`
5. Save
6. Update production env var: `NEXT_PUBLIC_APP_URL=https://www.aapkatourism.com`

## Testing

After deployment:

1. Make a test payment
2. Check if redirect works
3. If you get error 10002, verify URL matches exactly
