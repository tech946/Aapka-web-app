-- Migration: Add discount amount columns to package_date_availability table
-- Run this in your Supabase SQL Editor
-- 
-- IMPORTANT: Discount columns are added to package_date_availability table (NOT packages table)
-- because discounts are per date, not per package

-- Step 1: Verify table exists (optional check)
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'package_date_availability';

-- Step 2: Add discount amount columns to package_date_availability table
ALTER TABLE package_date_availability
ADD COLUMN IF NOT EXISTS adult_discount_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS child_discount_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS infant_discount_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS discount_start_date DATE,
ADD COLUMN IF NOT EXISTS discount_end_date DATE;

-- Step 3: Add index for faster queries on discount dates
CREATE INDEX IF NOT EXISTS idx_package_date_availability_discount_dates 
ON package_date_availability(discount_start_date, discount_end_date)
WHERE adult_discount_amount IS NOT NULL;

-- Step 4: Verify columns were added successfully (run this to check)
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'package_date_availability' 
-- AND column_name IN ('adult_discount_amount', 'child_discount_amount', 'infant_discount_amount', 'discount_start_date', 'discount_end_date')
-- ORDER BY column_name;
