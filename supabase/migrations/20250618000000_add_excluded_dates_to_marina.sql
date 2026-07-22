-- Add excluded_dates to marina_cruise_dinners
ALTER TABLE marina_cruise_dinners
  ADD COLUMN IF NOT EXISTS excluded_dates TEXT[] DEFAULT NULL;
