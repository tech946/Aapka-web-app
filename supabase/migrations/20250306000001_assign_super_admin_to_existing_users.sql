-- Assign Super Admin to all existing auth users (fixes 403 on first setup)
-- Run after 20250306000000_add_web_app_roles.sql

INSERT INTO user_roles (user_id, role_id, is_primary, is_active)
SELECT id, 1, true, true FROM auth.users
ON CONFLICT (user_id, role_id) DO UPDATE SET is_active = true, is_primary = true;
