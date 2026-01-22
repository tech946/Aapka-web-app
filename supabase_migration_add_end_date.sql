-- Migration: Add end_date column to packages table for flexible date packages
-- Run this in your Supabase SQL Editor

-- Add end_date column to packages table
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS end_date DATE;
