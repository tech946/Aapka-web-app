-- Migration: Add pdf_url column to packages table for PDF brochure/itinerary uploads
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Add pdf_url column to packages table (stores Supabase Storage public URL)
ALTER TABLE packages ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Optional: Add comment for documentation
COMMENT ON COLUMN packages.pdf_url IS 'Optional PDF brochure or itinerary URL stored in Supabase documents bucket';
