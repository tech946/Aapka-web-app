-- Create property_status table
CREATE TABLE IF NOT EXISTS property_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7), -- Hex color code for status display
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint on name (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_property_status_name'
  ) THEN
    ALTER TABLE property_status ADD CONSTRAINT unique_property_status_name UNIQUE (name);
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_property_status_name ON property_status(name);
CREATE INDEX IF NOT EXISTS idx_property_status_is_active ON property_status(is_active);
CREATE INDEX IF NOT EXISTS idx_property_status_created_at ON property_status(created_at);

-- Enable RLS
ALTER TABLE property_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'property_status' AND policyname = 'Allow all operations for service role'
  ) THEN
    CREATE POLICY "Allow all operations for service role" ON property_status
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'property_status' AND policyname = 'Allow read access for authenticated users'
  ) THEN
    CREATE POLICY "Allow read access for authenticated users" ON property_status
      FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_property_status_updated_at()
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
    WHERE tgname = 'update_property_status_updated_at'
  ) THEN
    CREATE TRIGGER update_property_status_updated_at
      BEFORE UPDATE ON property_status
      FOR EACH ROW
      EXECUTE FUNCTION update_property_status_updated_at();
  END IF;
END $$;

-- Insert some default property statuses
INSERT INTO property_status (name, description, color, is_active) VALUES
  ('Available', 'Property is available for rent or sale', '#52c41a', true),
  ('Rented', 'Property has been rented out', '#1890ff', true),
  ('Sold', 'Property has been sold', '#722ed1', true),
  ('Under Maintenance', 'Property is under maintenance or renovation', '#fa8c16', true),
  ('Off Market', 'Property is temporarily off the market', '#f5222d', true),
  ('Pending', 'Property sale/rent is pending approval', '#faad14', true)
ON CONFLICT (name) DO NOTHING;
