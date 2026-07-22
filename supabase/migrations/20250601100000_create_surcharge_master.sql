-- Surcharge master: price surcharges applied to specific date ranges

CREATE TABLE IF NOT EXISTS surcharge_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price DECIMAL(10, 2) NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT surcharge_master_valid_dates CHECK (to_date >= from_date),
  CONSTRAINT surcharge_master_price_positive CHECK (price >= 0)
);

CREATE INDEX IF NOT EXISTS idx_surcharge_master_dates ON surcharge_master (from_date, to_date);

CREATE OR REPLACE FUNCTION update_surcharge_master_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_surcharge_master_updated_at ON surcharge_master;

CREATE TRIGGER trigger_update_surcharge_master_updated_at
  BEFORE UPDATE ON surcharge_master
  FOR EACH ROW
  EXECUTE FUNCTION update_surcharge_master_updated_at();

COMMENT ON TABLE surcharge_master IS 'Master list of surcharges with price and applicable date range';
