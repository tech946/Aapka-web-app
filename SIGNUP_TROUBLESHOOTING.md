# Signup Flow Troubleshooting Guide

## Issues Identified and Fixed

### 1. Missing Email Redirect Configuration

**Problem**: The signup pages were not specifying `emailRedirectTo` in the signup options.

**Fix Applied**:

- Added `emailRedirectTo` to both signup pages
- Set proper callback URLs: `/signup-callback` and `/auth/signup-callback`

### 2. Inconsistent Callback Handling

**Problem**: Callback pages were not properly handling email confirmation tokens.

**Fix Applied**:

- Updated callback pages to parse URL hash fragments
- Added proper session setting with access/refresh tokens
- Improved error handling and user feedback

### 3. Environment Variable Configuration

**Problem**: Missing environment variables causing potential configuration issues.

**Fix Applied**:

- Updated Supabase client to use environment variables with fallbacks
- Added proper auth configuration options

## Current Status

✅ **Fixed Issues:**

- Email redirect URLs configured
- Callback pages updated to handle email confirmation
- Better error handling and logging
- Environment variable support added

## Testing Steps

### 1. Run the Test Script

```bash
node test-signup-flow.js
```

### 2. Manual Testing

1. Go to `/signup` or `/auth/signup`
2. Enter a test email and password
3. Check browser console for detailed logs
4. Check your email for confirmation link
5. Click the confirmation link
6. Verify you're redirected to `/dashboard`

### 3. Check Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Check if the user appears in the list
4. Verify the user's email confirmation status

## Common Issues and Solutions

### Issue: User Created but No Email Sent

**Possible Causes:**

- Email confirmation disabled in Supabase settings
- SMTP provider not configured
- Email in spam folder
- Rate limiting on Supabase's default email provider

**Solutions:**

1. Check Supabase Auth settings:
   - Go to Authentication > Settings
   - Verify "Confirm email" is enabled
   - Check SMTP configuration

2. Configure custom SMTP provider:
   - Use a service like SendGrid, Mailgun, or AWS SES
   - Update SMTP settings in Supabase

### Issue: User Not Created in Database

**Possible Causes:**

- Database connection issues
- RLS (Row Level Security) policies blocking user creation
- Database triggers failing

**Solutions:**

1. Check database connection
2. Review RLS policies on auth.users table
3. Check database logs for errors

### Issue: Confirmation Link Not Working

**Possible Causes:**

- Incorrect redirect URL configuration
- CORS issues
- Session handling problems

**Solutions:**

1. Verify redirect URLs in Supabase settings
2. Check callback page implementation
3. Test with different browsers

## Debugging Commands

### Check Environment Variables

```bash
node test-env.js
```

### Test Supabase Connection

```bash
node test-supabase.js
```

### Test Signup Flow

```bash
node test-signup-flow.js
```

## Supabase Configuration Checklist

### Authentication Settings

- [ ] Email confirmation enabled
- [ ] SMTP provider configured
- [ ] Redirect URLs configured
- [ ] Site URL set correctly

### Database Settings

- [ ] RLS policies configured
- [ ] Auth triggers working
- [ ] User table accessible

### API Settings

- [ ] API keys configured
- [ ] CORS settings correct
- [ ] Rate limiting appropriate

## Next Steps

1. **Test the fixes** using the provided test script
2. **Check Supabase dashboard** for user creation
3. **Verify email delivery** (check spam folder)
4. **Test the complete flow** from signup to dashboard
5. **Configure custom SMTP** if using production

## Support Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Email Configuration Guide](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Troubleshooting Auth Issues](https://supabase.com/docs/guides/troubleshooting/not-receiving-auth-emails-from-the-supabase-project-OFSNzw)
