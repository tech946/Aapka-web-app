-- Update starting_price column to support JSON data
-- This migration changes the starting_price column from DECIMAL to TEXT to support JSON currency data

-- First, add a new column for the JSON price data
ALTER TABLE properties ADD COLUMN IF NOT EXISTS starting_price_json TEXT;

-- Copy existing numeric data to the new column as JSON format
UPDATE properties 
SET starting_price_json = CASE 
  WHEN starting_price IS NOT NULL THEN 
    json_build_object(
      'currentSign', '$',
      'value', starting_price::text,
      'currencyName', 'USD'
    )::text
  ELSE NULL
END;

-- Drop the old column
ALTER TABLE properties DROP COLUMN IF EXISTS starting_price;

-- Rename the new column to starting_price
ALTER TABLE properties RENAME COLUMN starting_price_json TO starting_price;

-- Update the index to work with the new column type
DROP INDEX IF EXISTS idx_properties_starting_price;
CREATE INDEX IF NOT EXISTS idx_properties_starting_price ON properties(starting_price);

-- Add a comment to document the new format
COMMENT ON COLUMN properties.starting_price IS 'JSON string containing currency data: {"currentSign": "$", "value": "100000", "currencyName": "USD"}';
