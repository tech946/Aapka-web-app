# API Key Troubleshooting Guide

## ❌ Error: "Invalid API key"

This error occurs when Supabase can't authenticate your requests. Here's how to fix it:

## 🔍 Step 1: Check Environment Variables

Run the environment test:

```bash
node test-env.js
```

**Expected output:**

```
✅ NEXT_PUBLIC_SUPABASE_URL: https://ghsgnjzkgygiqmhjvtpi.supabase.co
✅ SUPABASE_SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔍 Step 2: Test Supabase Connection

Run the connection test:

```bash
node test-supabase.js
```

**Expected output:**

```
✅ Database connection successful!
✅ Storage connection successful!
```

## 🔧 Common Issues & Solutions

### Issue 1: Missing Environment Variables

**Symptoms:** `Missing SUPABASE_SERVICE_ROLE_KEY environment variable`

**Solution:**

1. Create/check `.env.local` file in project root
2. Add these variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ghsgnjzkgygiqmhjvtpi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Issue 2: Wrong API Key

**Symptoms:** `Invalid API key`

**Solution:**

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Copy the **service_role** key (NOT the anon key)
4. Update your `.env.local` file

### Issue 3: Wrong Supabase URL

**Symptoms:** Connection timeouts or 404 errors

**Solution:**

1. Check your Supabase project URL
2. Make sure it matches exactly in `.env.local`
3. URL should look like: `https://your-project-id.supabase.co`

### Issue 4: Key Permissions

**Symptoms:** RLS policy errors even with service key

**Solution:**

1. Ensure you're using the **service_role** key
2. The service key should bypass RLS policies
3. Check if the key is expired or revoked

## 🧪 Quick Tests

### Test 1: Environment Variables

```bash
node test-env.js
```

### Test 2: Supabase Connection

```bash
node test-supabase.js
```

### Test 3: API Endpoints

```bash
node test-apis.js
```

## 📋 Environment File Template

Create `.env.local` in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Anon key (for client-side operations)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔑 Getting Your Service Role Key

1. **Go to Supabase Dashboard**
2. **Select your project**
3. **Navigate to Settings → API**
4. **Copy the "service_role" key** (it's the long JWT token)
5. **Paste it in your `.env.local` file**

## ⚠️ Important Notes

- **Service Role Key**: Has full access, bypasses RLS
- **Anon Key**: Limited access, subject to RLS policies
- **Never commit** `.env.local` to version control
- **Restart your dev server** after changing environment variables

## 🎯 Expected Results

After fixing the API key issue, you should see:

- ✅ All API endpoints return data (not errors)
- ✅ Can create/update/delete records
- ✅ Image uploads work for property types
- ✅ No more "Invalid API key" errors

## 🆘 Still Having Issues?

1. **Double-check** the service role key in Supabase Dashboard
2. **Restart** your development server (`npm run dev`)
3. **Clear** browser cache and try again
4. **Check** Supabase project status and billing
