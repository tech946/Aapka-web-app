-- Create developers table
CREATE TABLE IF NOT EXISTS developers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),
  address TEXT,
  country_id UUID REFERENCES countries(id) ON DELETE SET NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint on name
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_developer_name'
  ) THEN
    ALTER TABLE developers ADD CONSTRAINT unique_developer_name UNIQUE (name);
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_developers_name ON developers(name);
CREATE INDEX IF NOT EXISTS idx_developers_country_id ON developers(country_id);
CREATE INDEX IF NOT EXISTS idx_developers_is_active ON developers(is_active);
CREATE INDEX IF NOT EXISTS idx_developers_created_at ON developers(created_at);

-- Enable RLS
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'developers' AND policyname = 'Allow all operations for service role'
  ) THEN
    CREATE POLICY "Allow all operations for service role" ON developers
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'developers' AND policyname = 'Allow read access for authenticated users'
  ) THEN
    CREATE POLICY "Allow read access for authenticated users" ON developers
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Create storage bucket for developer images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('developer-images', 'developer-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for developer images
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Allow public read access to developer images'
  ) THEN
    CREATE POLICY "Allow public read access to developer images" ON storage.objects
      FOR SELECT USING (bucket_id = 'developer-images');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Allow service role to upload developer images'
  ) THEN
    CREATE POLICY "Allow service role to upload developer images" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'developer-images' AND auth.role() = 'service_role');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Allow service role to update developer images'
  ) THEN
    CREATE POLICY "Allow service role to update developer images" ON storage.objects
      FOR UPDATE USING (bucket_id = 'developer-images' AND auth.role() = 'service_role');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Allow service role to delete developer images'
  ) THEN
    CREATE POLICY "Allow service role to delete developer images" ON storage.objects
      FOR DELETE USING (bucket_id = 'developer-images' AND auth.role() = 'service_role');
  END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_developers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_developers_updated_at'
  ) THEN
    CREATE TRIGGER update_developers_updated_at
      BEFORE UPDATE ON developers
      FOR EACH ROW
      EXECUTE FUNCTION update_developers_updated_at();
  END IF;
END $$;
