-- Migration: Remove visa-related columns from package_date_availability table
-- Since visa pricing is now at package level, not per date
-- Run this in your Supabase SQL Editor

-- Step 1: Remove visa columns from package_date_availability
ALTER TABLE package_date_availability
DROP COLUMN IF EXISTS with_visa,
DROP COLUMN IF EXISTS adult_visa_price,
DROP COLUMN IF EXISTS child_visa_price,
DROP COLUMN IF EXISTS infant_visa_price;
