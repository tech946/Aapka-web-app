-- Add property_images column to properties table
-- This column will store an array of image URLs (max 5 images per property)

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS property_images TEXT[] DEFAULT '{}';

-- Add a comment to the column
COMMENT ON COLUMN properties.property_images IS 'Array of image URLs for the property (max 5 images)';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_properties_images ON properties USING GIN (property_images);

