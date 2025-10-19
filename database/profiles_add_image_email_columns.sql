-- Add profile_image_url and email_address columns to profiles table
-- This migration adds the required columns for mobile profile management

-- Add profile_image_url column (TEXT for storing image URLs)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Add email_address column (TEXT for storing email address)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_address TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_profile_image_url ON profiles(profile_image_url);
CREATE INDEX IF NOT EXISTS idx_profiles_email_address ON profiles(email_address);

-- Create a function to automatically populate email_address from auth.users
CREATE OR REPLACE FUNCTION sync_user_email_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the email_address in profiles table when auth.users is updated
  UPDATE profiles 
  SET email_address = NEW.email 
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync email from auth.users to profiles
DROP TRIGGER IF EXISTS sync_email_to_profile ON auth.users;
CREATE TRIGGER sync_email_to_profile
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_email_to_profile();

-- Create a function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new profile when a user is created in auth.users
  INSERT INTO profiles (id, email_address, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to create profile on user signup
DROP TRIGGER IF EXISTS create_profile_on_user_signup ON auth.users;
CREATE TRIGGER create_profile_on_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_on_signup();

-- Update RLS policies to allow users to update their own profile image and email
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Allow users to update own profile fields'
  ) THEN
    CREATE POLICY "Allow users to update own profile fields" ON profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Allow users to insert their own profile (for the trigger)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Allow users to insert own profile'
  ) THEN
    CREATE POLICY "Allow users to insert own profile" ON profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;
