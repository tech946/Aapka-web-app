-- Migration: Remove company_name and website_url columns from contact_queries table
-- Run this if you already have the contact_queries table with these columns

-- Drop the columns
ALTER TABLE contact_queries 
  DROP COLUMN IF EXISTS company_name,
  DROP COLUMN IF EXISTS website_url;

-- Note: This migration will permanently delete the company_name and website_url data
-- Make sure to backup your data before running this migration if needed

