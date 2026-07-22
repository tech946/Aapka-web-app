-- Pickup location text for UAE tours (shown on checkout, set in dashboard).
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS pickup_location TEXT DEFAULT NULL;

COMMENT ON COLUMN packages.pickup_location IS 'Tour-only pickup location text displayed at checkout for UAE tour packages.';
