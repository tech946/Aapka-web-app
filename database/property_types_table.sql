-- Create property_types table
CREATE TABLE IF NOT EXISTS property_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on name for faster lookups
CREATE INDEX IF NOT EXISTS idx_property_types_name ON property_types(name);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_property_types_updated_at 
    BEFORE UPDATE ON property_types 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for property type images (run this in Supabase dashboard or via SQL)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('property-type-images', 'property-type-images', true);

-- Set up RLS (Row Level Security) policies
ALTER TABLE property_types ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust based on your auth requirements)
CREATE POLICY "Allow all operations for authenticated users" ON property_types
  FOR ALL USING (auth.role() = 'authenticated');

-- Allow public read access (optional, adjust based on your requirements)
CREATE POLICY "Allow public read access" ON property_types
  FOR SELECT USING (true);
