-- Create platform_fee table in Supabase
-- This table stores the platform fee percentage (max 10%)

CREATE TABLE IF NOT EXISTS platform_fee (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (fee_percentage >= 0 AND fee_percentage <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a unique constraint to ensure only one row exists
CREATE UNIQUE INDEX IF NOT EXISTS platform_fee_single_row ON platform_fee ((1));

-- Insert default value (0%)
INSERT INTO platform_fee (fee_percentage)
VALUES (0.00)
ON CONFLICT DO NOTHING;

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_platform_fee_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_platform_fee_timestamp
  BEFORE UPDATE ON platform_fee
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_fee_updated_at();

-- Grant necessary permissions (adjust based on your RLS policies)
-- ALTER TABLE platform_fee ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (if needed):
-- CREATE POLICY "Allow authenticated users to read platform_fee"
--   ON platform_fee FOR SELECT
--   TO authenticated
--   USING (true);

-- CREATE POLICY "Allow authenticated users to update platform_fee"
--   ON platform_fee FOR UPDATE
--   TO authenticated
--   USING (true);

