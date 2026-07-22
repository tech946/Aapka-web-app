-- Migration: Fix price column issue in package_date_availability
-- Run this in your Supabase SQL Editor

-- Step 1: Make price column nullable (if it exists and is NOT NULL)
ALTER TABLE package_date_availability
ALTER COLUMN price DROP NOT NULL;

-- Step 2: If price column still exists, set it to NULL for all rows
-- (since we're now using adult_price, child_price, infant_price)
UPDATE package_date_availability
SET price = NULL
WHERE price IS NOT NULL;

-- Step 3: (Optional but recommended) Drop the old price column
-- Uncomment the line below if you want to remove the price column completely
-- ALTER TABLE package_date_availability DROP COLUMN price;
