-- Migration: Add gallery column to packages table
-- Run this in your Supabase SQL Editor
-- This column will store an array of gallery image URLs as JSONB

-- Add the gallery JSONB column to packages table
ALTER TABLE packages ADD COLUMN IF NOT EXISTS gallery JSONB DEFAULT '[]'::jsonb;

-- Create an index for faster JSON queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_packages_gallery ON packages USING GIN (gallery);

-- Comment explaining the JSON structure:
-- gallery column stores an array of image URLs:
-- [
--   "https://{project}.supabase.co/storage/v1/object/public/images/.../image1.jpg",
--   "https://{project}.supabase.co/storage/v1/object/public/images/.../image2.jpg",
--   ...
-- ]
