-- Create amenities table
CREATE TABLE IF NOT EXISTS amenities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_amenities_name ON amenities(name);
CREATE INDEX IF NOT EXISTS idx_amenities_created_at ON amenities(created_at);

-- Enable RLS
ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations for service role" ON amenities
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow read access for authenticated users" ON amenities
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create storage bucket for amenity images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('amenity-images', 'amenity-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for amenity images
CREATE POLICY "Allow public read access to amenity images" ON storage.objects
  FOR SELECT USING (bucket_id = 'amenity-images');

CREATE POLICY "Allow service role to upload amenity images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'amenity-images' AND auth.role() = 'service_role');

CREATE POLICY "Allow service role to update amenity images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'amenity-images' AND auth.role() = 'service_role');

CREATE POLICY "Allow service role to delete amenity images" ON storage.objects
  FOR DELETE USING (bucket_id = 'amenity-images' AND auth.role() = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_amenities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_amenities_updated_at
  BEFORE UPDATE ON amenities
  FOR EACH ROW
  EXECUTE FUNCTION update_amenities_updated_at();
