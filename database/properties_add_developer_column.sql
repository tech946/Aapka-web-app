-- Migration to add developer_id column to properties table
-- This adds a foreign key relationship between properties and developers

-- Add developer_id column to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS developer_id UUID;

-- Add foreign key constraint to developers table
ALTER TABLE properties 
ADD CONSTRAINT properties_developer_id_fkey 
FOREIGN KEY (developer_id) 
REFERENCES developers(id) 
ON DELETE SET NULL;

-- Create index on developer_id for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_developer_id ON properties(developer_id);

-- Comment on the column
COMMENT ON COLUMN properties.developer_id IS 'Reference to the developer (builder) of the property';

