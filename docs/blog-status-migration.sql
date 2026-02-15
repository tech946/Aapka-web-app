-- ============================================================
-- Migration: Blog Status Update (Active/Inactive)
-- ============================================================
-- Run this in Supabase SQL Editor if you have blog_posts with
-- old status values (draft, published, archived)
-- ============================================================

-- 1. Drop the existing CHECK constraint (PostgreSQL)
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_status_check;

-- 2. Migrate existing data: published -> active, draft/archived -> inactive
UPDATE blog_posts SET status = 'active' WHERE status = 'published';
UPDATE blog_posts SET status = 'inactive' WHERE status IN ('draft', 'archived');

-- 3. Add new CHECK constraint
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_status_check 
  CHECK (status IN ('active', 'inactive'));

-- 4. Update default
ALTER TABLE blog_posts ALTER COLUMN status SET DEFAULT 'inactive';
