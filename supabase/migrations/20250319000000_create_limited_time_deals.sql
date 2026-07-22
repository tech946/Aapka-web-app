-- Migration: Create limited_time_deals table and add limited_time_deal_id to bookings
-- Limited Time Deals reference offer packages with date range, 100 AED booking fee, max 46 bookings/day

-- Step 1: Create limited_time_deals table
CREATE TABLE IF NOT EXISTS limited_time_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_package_id UUID NOT NULL REFERENCES packages(package_id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  booking_fee_aed DECIMAL(10, 2) NOT NULL DEFAULT 100,
  max_bookings_per_day INTEGER NOT NULL DEFAULT 46,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT ltd_valid_dates CHECK (end_date > start_date),
  CONSTRAINT ltd_valid_max_bookings CHECK (max_bookings_per_day > 0)
);

CREATE INDEX IF NOT EXISTS idx_limited_time_deals_offer_package ON limited_time_deals(offer_package_id);
CREATE INDEX IF NOT EXISTS idx_limited_time_deals_active ON limited_time_deals(is_active);
CREATE INDEX IF NOT EXISTS idx_limited_time_deals_dates ON limited_time_deals(start_date, end_date);

CREATE OR REPLACE FUNCTION update_limited_time_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_limited_time_deals_updated_at
  BEFORE UPDATE ON limited_time_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_limited_time_deals_updated_at();

COMMENT ON TABLE limited_time_deals IS 'Limited time deals referencing offer packages with date range and per-day booking cap';

-- Step 2: Add limited_time_deal_id to bookings (nullable, for LTD bookings only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'limited_time_deal_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN limited_time_deal_id UUID REFERENCES limited_time_deals(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_bookings_limited_time_deal ON bookings(limited_time_deal_id);
  END IF;
END $$;
