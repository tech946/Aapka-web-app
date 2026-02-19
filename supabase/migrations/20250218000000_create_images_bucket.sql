-- Create the "images" storage bucket for image uploads (replaces Cloudinary)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Allow public read access (images are public URLs)
CREATE POLICY "Public read access for images"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Note: API routes use supabaseAdmin (service role) which bypasses RLS for upload/delete
