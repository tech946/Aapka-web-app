-- Remove days, nights, min_adults from marina_cruise_dinners
ALTER TABLE marina_cruise_dinners
  DROP COLUMN IF EXISTS package_days,
  DROP COLUMN IF EXISTS package_nights,
  DROP COLUMN IF EXISTS min_adults;
