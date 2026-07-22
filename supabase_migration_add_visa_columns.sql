-- Migration: Add visa-related columns to package_date_availability
-- Run this in your Supabase SQL Editor if you already have the package_date_availability table

-- Step 1: Add new columns
ALTER TABLE package_date_availability
ADD COLUMN IF NOT EXISTS with_visa BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS adult_visa_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS child_visa_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS infant_visa_price DECIMAL(10, 2) NOT NULL DEFAULT 0;
