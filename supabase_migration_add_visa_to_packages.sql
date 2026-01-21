-- Migration: Add visa-related columns to packages table
-- Run this in your Supabase SQL Editor

-- Step 1: Add new columns to packages table
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS with_visa BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS adult_visa_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS child_visa_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS infant_visa_price DECIMAL(10, 2);
