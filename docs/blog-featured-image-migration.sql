-- ============================================================
-- Migration: Add Featured Image (Thumbnail) to Blog Posts
-- ============================================================
-- Run this in Supabase SQL Editor if blog_posts table exists
-- but does NOT have the featured_image column
-- ============================================================

-- Add featured_image column if it doesn't exist (stores Cloudinary URL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'blog_posts' AND column_name = 'featured_image'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN featured_image VARCHAR(255);
  END IF;
END $$;
