-- Migration: Create package_deals table for Deals of the Day
-- This table stores special pricing deals for packages

-- Step 1: Create package_deals table
CREATE TABLE IF NOT EXISTS package_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES packages(package_id) ON DELETE CASCADE,
  
  -- Deal pricing for different person types
  deal_adult_price DECIMAL(10, 2),
  deal_child_price DECIMAL(10, 2),
  deal_infant_price DECIMAL(10, 2),
  deal_solo_traveller_price DECIMAL(10, 2),
  
  -- Original prices snapshot (for reference)
  original_adult_price DECIMAL(10, 2),
  original_child_price DECIMAL(10, 2),
  original_infant_price DECIMAL(10, 2),
  original_solo_traveller_price DECIMAL(10, 2),
  
  -- Deal timing
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Deal status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

-- Step 2: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_package_deals_package_id ON package_deals(package_id);
CREATE INDEX IF NOT EXISTS idx_package_deals_active ON package_deals(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_package_deals_dates ON package_deals(start_date, end_date);

-- Step 3: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_package_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger to auto-update updated_at
CREATE TRIGGER trigger_update_package_deals_updated_at
  BEFORE UPDATE ON package_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_package_deals_updated_at();

-- Step 5: Add RLS policies (if using Row Level Security)
-- ALTER TABLE package_deals ENABLE ROW LEVEL SECURITY;

-- Policy for reading active deals (public)
-- CREATE POLICY "Public can view active deals"
--   ON package_deals FOR SELECT
--   USING (is_active = true AND NOW() >= start_date AND NOW() <= end_date);

-- Policy for admin operations (adjust based on your auth setup)
-- CREATE POLICY "Admins can manage deals"
--   ON package_deals FOR ALL
--   USING (auth.role() = 'admin');

-- Step 6: Add comment for documentation
COMMENT ON TABLE package_deals IS 'Stores special pricing deals for packages (Deals of the Day)';
COMMENT ON COLUMN package_deals.deal_adult_price IS 'Special deal price for adults';
COMMENT ON COLUMN package_deals.deal_child_price IS 'Special deal price for children';
COMMENT ON COLUMN package_deals.deal_infant_price IS 'Special deal price for infants';
COMMENT ON COLUMN package_deals.deal_solo_traveller_price IS 'Special deal price for solo travellers';
COMMENT ON COLUMN package_deals.original_adult_price IS 'Snapshot of original adult price when deal was created';
COMMENT ON COLUMN package_deals.original_child_price IS 'Snapshot of original child price when deal was created';
COMMENT ON COLUMN package_deals.original_infant_price IS 'Snapshot of original infant price when deal was created';
COMMENT ON COLUMN package_deals.original_solo_traveller_price IS 'Snapshot of original solo traveller price when deal was created';
