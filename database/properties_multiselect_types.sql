-- Add new columns for multiple property types
-- property_type_ids: comma-separated IDs (e.g., "1,3,5")
-- property_types_text: comma-separated names (e.g., "Apartment, Villa, Townhouse")
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS property_type_ids TEXT;

ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS property_types_text TEXT;

-- Migrate existing data: copy property type ID and name to new columns
UPDATE properties p
SET 
  property_type_ids = p.property_type_id::TEXT,
  property_types_text = pt.name
FROM property_types pt
WHERE p.property_type_id = pt.id
AND (p.property_type_ids IS NULL OR p.property_types_text IS NULL);

-- After migration is complete and verified, you can optionally:
-- 1. Keep all columns for backward compatibility
-- 2. Or drop the old column:
-- ALTER TABLE properties DROP COLUMN property_type_id;

-- For now, we'll keep all columns for backward compatibility
-- The API will use property_type_ids and property_types_text when available

