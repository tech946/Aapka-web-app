-- Update profiles table to add new fields
-- Add new columns to existing profiles table

-- Add totalleads field (text)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS totalleads TEXT;

-- Add commissions field (JSONB for storing commission data)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS commissions JSONB;

-- Add notes field (text)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create indexes for better performance on search
CREATE INDEX IF NOT EXISTS idx_profiles_totalleads ON profiles(totalleads);
CREATE INDEX IF NOT EXISTS idx_profiles_commissions ON profiles USING GIN (commissions);
CREATE INDEX IF NOT EXISTS idx_profiles_notes ON profiles(notes);

-- Add updated_at column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- Update RLS policies if needed (profiles table should already have RLS enabled)
-- Allow service role to access all profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Allow all operations for service role'
  ) THEN
    CREATE POLICY "Allow all operations for service role" ON profiles
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

-- Allow authenticated users to read profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Allow read access for authenticated users'
  ) THEN
    CREATE POLICY "Allow read access for authenticated users" ON profiles
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Allow users to update their own profile
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Allow users to update own profile'
  ) THEN
    CREATE POLICY "Allow users to update own profile" ON profiles
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;
