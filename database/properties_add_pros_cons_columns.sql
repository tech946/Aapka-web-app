-- Add pros and cons columns to properties table
-- These will store rich text content with paragraph and bullet point formatting

-- Add pros column to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS pros TEXT;

-- Add cons column to properties table  
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS cons TEXT;

-- Add pros column to default_search_properties table
ALTER TABLE default_search_properties 
ADD COLUMN IF NOT EXISTS pros TEXT;

-- Add cons column to default_search_properties table
ALTER TABLE default_search_properties 
ADD COLUMN IF NOT EXISTS cons TEXT;

-- Add indexes for better performance on text search
CREATE INDEX IF NOT EXISTS idx_properties_pros ON properties USING gin(to_tsvector('english', pros));
CREATE INDEX IF NOT EXISTS idx_properties_cons ON properties USING gin(to_tsvector('english', cons));
CREATE INDEX IF NOT EXISTS idx_default_search_properties_pros ON default_search_properties USING gin(to_tsvector('english', pros));
CREATE INDEX IF NOT EXISTS idx_default_search_properties_cons ON default_search_properties USING gin(to_tsvector('english', cons));

-- Add comments to document the columns
COMMENT ON COLUMN properties.pros IS 'Rich text content describing property advantages and benefits';
COMMENT ON COLUMN properties.cons IS 'Rich text content describing property disadvantages and limitations';
COMMENT ON COLUMN default_search_properties.pros IS 'Rich text content describing property advantages and benefits';
COMMENT ON COLUMN default_search_properties.cons IS 'Rich text content describing property disadvantages and limitations';
