# Database Setup

## Fix 403 on Influencer Dashboard APIs

If you get **403 Forbidden** when accessing Influencer settings (Commission Settings, Manage Influencers, etc.):

### 1. Run the roles migration
Execute `supabase/migrations/20250306000000_add_web_app_roles.sql` in Supabase SQL Editor (or run `supabase db push`).

### 2. Assign Super Admin to your user
Edit `add-super-admin-by-email.sql` and set `target_email` to your dashboard login email, then run it in Supabase SQL Editor:

```sql
DO $$
DECLARE
  target_email TEXT := 'your-email@example.com';  -- CHANGE THIS
  uid UUID;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = target_email LIMIT 1;
  IF uid IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', target_email;
  END IF;
  INSERT INTO user_roles (user_id, role_id, is_primary, is_active)
  VALUES (uid, 1, true, true)
  ON CONFLICT (user_id, role_id) DO UPDATE SET is_active = true, is_primary = true;
  RAISE NOTICE 'Super Admin assigned to %', target_email;
END $$;
```
