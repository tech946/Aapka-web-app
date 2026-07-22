-- Migration: Add adult_price, child_price, infant_price columns to package_date_availability
-- Run this in your Supabase SQL Editor if you already have the package_date_availability table

-- Step 1: Add new columns
ALTER TABLE package_date_availability
ADD COLUMN IF NOT EXISTS adult_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS child_price DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS infant_price DECIMAL(10, 2) DEFAULT 0;

-- Step 2: Migrate existing price data to adult_price
UPDATE package_date_availability
SET adult_price = price
WHERE adult_price IS NULL;

-- Step 3: Set adult_price as NOT NULL after migration
ALTER TABLE package_date_availability
ALTER COLUMN adult_price SET NOT NULL;

-- Step 4: Set child_price and infant_price defaults
ALTER TABLE package_date_availability
ALTER COLUMN child_price SET DEFAULT 0,
ALTER COLUMN infant_price SET DEFAULT 0;

-- Step 5: (Optional) Remove old price column if you want
-- ALTER TABLE package_date_availability DROP COLUMN price;
