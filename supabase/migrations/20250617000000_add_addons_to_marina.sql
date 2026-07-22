-- Add add-ons (optional extras) to marina_cruise_dinners
-- Each item: { id, name, adult_price, child_price }
ALTER TABLE marina_cruise_dinners
  ADD COLUMN IF NOT EXISTS addons JSONB;
