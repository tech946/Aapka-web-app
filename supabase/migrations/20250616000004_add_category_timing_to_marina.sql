-- Add category and timing to marina cruise dinners
ALTER TABLE marina_cruise_dinners
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS timing TEXT;
