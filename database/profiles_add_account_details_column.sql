-- Add account_details column to profiles table for storing bank information
-- This migration adds the required column for mobile bank details management

-- Add account_details column (JSONB for storing bank details)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_details JSONB;

-- Create index for better performance on account_details queries
CREATE INDEX IF NOT EXISTS idx_profiles_account_details ON profiles USING GIN (account_details);

-- Add RLS policy to allow users to update their own account details
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Allow users to update own account details'
  ) THEN
    CREATE POLICY "Allow users to update own account details" ON profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Add RLS policy to allow users to insert their own account details (for the trigger)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Allow users to insert own account details'
  ) THEN
    CREATE POLICY "Allow users to insert own account details" ON profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;
