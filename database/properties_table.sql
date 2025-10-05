-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_name VARCHAR(255) NOT NULL,
  property_status_id UUID REFERENCES property_status(id) ON DELETE SET NULL,
  country_id UUID REFERENCES countries(id) ON DELETE SET NULL,
  state_id UUID REFERENCES states(id) ON DELETE SET NULL,
  city_id UUID REFERENCES cities(id) ON DELETE SET NULL,
  area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
  starting_price DECIMAL(15,2),
  property_type_id INTEGER REFERENCES property_types(id) ON DELETE SET NULL,
  payment_plan TEXT,
  handover TEXT,
  expected_appreciation TEXT,
  brochure_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint on project_name
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_property_project_name'
  ) THEN
    ALTER TABLE properties ADD CONSTRAINT unique_property_project_name UNIQUE (project_name);
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_properties_project_name ON properties(project_name);
CREATE INDEX IF NOT EXISTS idx_properties_property_status_id ON properties(property_status_id);
CREATE INDEX IF NOT EXISTS idx_properties_country_id ON properties(country_id);
CREATE INDEX IF NOT EXISTS idx_properties_state_id ON properties(state_id);
CREATE INDEX IF NOT EXISTS idx_properties_city_id ON properties(city_id);
CREATE INDEX IF NOT EXISTS idx_properties_area_id ON properties(area_id);
CREATE INDEX IF NOT EXISTS idx_properties_property_type_id ON properties(property_type_id);
CREATE INDEX IF NOT EXISTS idx_properties_starting_price ON properties(starting_price);
CREATE INDEX IF NOT EXISTS idx_properties_is_active ON properties(is_active);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at);

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'properties' AND policyname = 'Allow all operations for service role'
  ) THEN
    CREATE POLICY "Allow all operations for service role" ON properties
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'properties' AND policyname = 'Allow read access for authenticated users'
  ) THEN
    CREATE POLICY "Allow read access for authenticated users" ON properties
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Create property_amenities junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS property_amenities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  amenity_id UUID REFERENCES amenities(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, amenity_id)
);

-- Create indexes for junction table
CREATE INDEX IF NOT EXISTS idx_property_amenities_property_id ON property_amenities(property_id);
CREATE INDEX IF NOT EXISTS idx_property_amenities_amenity_id ON property_amenities(amenity_id);

-- Enable RLS for junction table
ALTER TABLE property_amenities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for junction table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'property_amenities' AND policyname = 'Allow all operations for service role'
  ) THEN
    CREATE POLICY "Allow all operations for service role" ON property_amenities
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'property_amenities' AND policyname = 'Allow read access for authenticated users'
  ) THEN
    CREATE POLICY "Allow read access for authenticated users" ON property_amenities
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Create storage bucket for property brochures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-brochures', 'property-brochures', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for property brochures
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Allow public read access to property brochures'
  ) THEN
    CREATE POLICY "Allow public read access to property brochures" ON storage.objects
      FOR SELECT USING (bucket_id = 'property-brochures');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Allow service role to upload property brochures'
  ) THEN
    CREATE POLICY "Allow service role to upload property brochures" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'property-brochures' AND auth.role() = 'service_role');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Allow service role to update property brochures'
  ) THEN
    CREATE POLICY "Allow service role to update property brochures" ON storage.objects
      FOR UPDATE USING (bucket_id = 'property-brochures' AND auth.role() = 'service_role');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' AND policyname = 'Allow service role to delete property brochures'
  ) THEN
    CREATE POLICY "Allow service role to delete property brochures" ON storage.objects
      FOR DELETE USING (bucket_id = 'property-brochures' AND auth.role() = 'service_role');
  END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_properties_updated_at()
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
    WHERE tgname = 'update_properties_updated_at'
  ) THEN
    CREATE TRIGGER update_properties_updated_at
      BEFORE UPDATE ON properties
      FOR EACH ROW
      EXECUTE FUNCTION update_properties_updated_at();
  END IF;
END $$;
