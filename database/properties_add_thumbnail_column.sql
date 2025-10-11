-- Add thumbnail_image column to properties table
-- This column will store a single thumbnail image URL (required field)
-- Thumbnail size should not exceed 800px

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS thumbnail_image TEXT;

-- Add a comment to the column
COMMENT ON COLUMN properties.thumbnail_image IS 'Thumbnail image URL for the property (required, max 800px)';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_properties_thumbnail ON properties(thumbnail_image);

