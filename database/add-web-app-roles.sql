-- Web App Team & Roles Schema (standalone - NOT shared with CRM)
-- Run this in your Web App's Supabase SQL Editor
-- Creates: roles, user_roles, and adds role columns to profiles

-- 1. Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  level INTEGER NOT NULL DEFAULT 2,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create user_roles table (links auth.users to roles)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  sub_role_id INTEGER,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- 3. Add role columns to profiles (table may exist from Supabase auth or agent flow)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role_id') THEN
      ALTER TABLE public.profiles ADD COLUMN role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role_name') THEN
      ALTER TABLE public.profiles ADD COLUMN role_name VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email_address') THEN
      ALTER TABLE public.profiles ADD COLUMN email_address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name') THEN
      ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone') THEN
      ALTER TABLE public.profiles ADD COLUMN phone TEXT;
    END IF;
  ELSE
    -- Create profiles if it doesn't exist
    CREATE TABLE public.profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email_address TEXT,
      full_name TEXT,
      phone TEXT,
      role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
      role_name VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;

-- 4. Insert roles (Super Admin = 1, Content Editor = 2)
INSERT INTO roles (id, name, display_name, level, is_active, created_at, updated_at)
VALUES 
  (1, 'super_admin', 'Super Admin', 1, true, NOW(), NOW()),
  (2, 'content_editor', 'Content Editor', 2, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    display_name = EXCLUDED.display_name,
    level = EXCLUDED.level,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 5. Add Super Admin to your user (user_roles was empty):
--    Run: database/add-super-admin-by-email.sql
--    Edit the file and set target_email to your login email, then run it in SQL Editor.
