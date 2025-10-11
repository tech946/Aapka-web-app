-- Create mobile_home_data table
CREATE TABLE IF NOT EXISTS mobile_home_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  featured_video_url TEXT,
  tagline_text TEXT,
  properties_by_type JSONB DEFAULT '[]'::jsonb,
  selected_developers JSONB DEFAULT '[]'::jsonb,
  story_images JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mobile_home_data_updated_at 
  BEFORE UPDATE ON mobile_home_data 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE mobile_home_data ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read
CREATE POLICY "Anyone can read mobile home data" ON mobile_home_data
  FOR SELECT USING (true);

-- Policy for authenticated users to insert
CREATE POLICY "Authenticated users can insert mobile home data" ON mobile_home_data
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update
CREATE POLICY "Authenticated users can update mobile home data" ON mobile_home_data
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for authenticated users to delete
CREATE POLICY "Authenticated users can delete mobile home data" ON mobile_home_data
  FOR DELETE USING (auth.role() = 'authenticated');

-- Insert a default record
INSERT INTO mobile_home_data (tagline_text, is_active)
VALUES ('Welcome to Proptz - Your Property Partner', true);

-- Add indexes for performance
CREATE INDEX idx_mobile_home_data_is_active ON mobile_home_data(is_active);
CREATE INDEX idx_mobile_home_data_created_at ON mobile_home_data(created_at DESC);

