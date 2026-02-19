

-- Add featured_image column if it doesn't exist (stores image URL from Supabase storage)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'blog_posts' AND column_name = 'featured_image'
  ) THEN
    ALTER TABLE blog_posts ADD COLUMN featured_image VARCHAR(255);
  END IF;
END $$;
