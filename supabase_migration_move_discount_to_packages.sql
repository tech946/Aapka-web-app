-- Migration: Move discount columns from package_date_availability to packages table
-- Run this in your Supabase SQL Editor
-- 
-- IMPORTANT: Discounts are now at package level, not per date

-- Step 1: Add discount columns to packages table
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS adult_discount_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS child_discount_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS infant_discount_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS discount_start_date DATE,
ADD COLUMN IF NOT EXISTS discount_end_date DATE;

-- Step 2: Remove discount columns from package_date_availability table
ALTER TABLE package_date_availability
DROP COLUMN IF EXISTS adult_discount_amount,
DROP COLUMN IF EXISTS child_discount_amount,
DROP COLUMN IF EXISTS infant_discount_amount,
DROP COLUMN IF EXISTS discount_start_date,
DROP COLUMN IF EXISTS discount_end_date;

-- Step 3: Drop the old index if it exists
DROP INDEX IF EXISTS idx_package_date_availability_discount_dates;

-- Step 4: Add index for faster queries on discount dates in packages table
CREATE INDEX IF NOT EXISTS idx_packages_discount_dates 
ON packages(discount_start_date, discount_end_date)
WHERE adult_discount_amount IS NOT NULL;

-- Step 5: Verify columns were added/removed (run this to check)
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'packages' 
-- AND column_name IN ('adult_discount_amount', 'child_discount_amount', 'infant_discount_amount', 'discount_start_date', 'discount_end_date')
-- ORDER BY column_name;
