-- Add Super Admin role to a user by email
-- Run in Supabase SQL Editor. Replace 'your-email@example.com' with your login email.

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

  INSERT INTO profiles (id, email_address, full_name, role_id, role_name)
  VALUES (uid, target_email, 'Super Admin', 1, 'super_admin')
  ON CONFLICT (id) DO UPDATE SET role_id = 1, role_name = 'super_admin', email_address = target_email;

  RAISE NOTICE 'Super Admin assigned to %', target_email;
END $$;
