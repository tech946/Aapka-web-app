-- Update unit types from single to multi-select (like property types)
-- This migration changes unit_type_id to unit_type_ids and adds unit_types_text

-- Drop the old single unit_type_id column
ALTER TABLE properties DROP COLUMN IF EXISTS unit_type_id;

-- Add new columns for multiple unit types
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS unit_type_ids TEXT, -- Comma-separated unit type IDs (e.g., "1,3,5")
ADD COLUMN IF NOT EXISTS unit_types_text TEXT; -- Comma-separated unit type names (e.g., "Studio, 1 BHK, 2 BHK")

-- Add comment to describe the columns
COMMENT ON COLUMN properties.unit_type_ids IS 'Comma-separated unit type IDs for this property';
COMMENT ON COLUMN properties.unit_types_text IS 'Comma-separated unit type names for display purposes';

-- No index needed for text fields with comma-separated values

