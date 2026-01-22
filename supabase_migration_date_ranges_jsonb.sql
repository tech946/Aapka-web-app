-- Migration: Add date_ranges JSONB column to packages table
-- Run this in your Supabase SQL Editor

-- 1. Add the date_ranges JSONB column to packages table
ALTER TABLE packages ADD COLUMN IF NOT EXISTS date_ranges JSONB DEFAULT '[]'::jsonb;

-- 2. Create an index for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_packages_date_ranges ON packages USING GIN (date_ranges);

-- 3. Migrate existing data from package_date_availability to the new column
-- This groups consecutive dates with same prices into ranges
WITH ordered_dates AS (
  SELECT 
    package_id,
    date,
    COALESCE(adult_price, price, 0) as adult_price,
    COALESCE(child_price, 0) as child_price,
    COALESCE(infant_price, 0) as infant_price,
    COALESCE(is_sold_out, false) as is_sold_out,
    date - (ROW_NUMBER() OVER (
      PARTITION BY package_id, COALESCE(adult_price, price, 0), COALESCE(child_price, 0), COALESCE(infant_price, 0), COALESCE(is_sold_out, false) 
      ORDER BY date
    ))::INTEGER as grp
  FROM package_date_availability
),
date_ranges_grouped AS (
  SELECT
    package_id,
    MIN(date) as from_date,
    MAX(date) as to_date,
    adult_price,
    child_price,
    infant_price,
    is_sold_out
  FROM ordered_dates
  GROUP BY package_id, adult_price, child_price, infant_price, is_sold_out, grp
),
package_ranges AS (
  SELECT
    package_id,
    jsonb_agg(
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'fromDate', from_date::text,
        'toDate', to_date::text,
        'adultPrice', adult_price,
        'childPrice', child_price,
        'infantPrice', infant_price,
        'isSoldOut', is_sold_out
      ) ORDER BY from_date
    ) as ranges
  FROM date_ranges_grouped
  GROUP BY package_id
)
UPDATE packages p
SET date_ranges = COALESCE(pr.ranges, '[]'::jsonb)
FROM package_ranges pr
WHERE p.package_id = pr.package_id;

-- 4. Comment explaining the JSON structure:
-- date_ranges column stores an array of date range objects:
-- [
--   {
--     "id": "uuid-string",
--     "fromDate": "2026-05-01",
--     "toDate": "2026-05-15",
--     "adultPrice": 1200,
--     "childPrice": 800,
--     "infantPrice": 0,
--     "isSoldOut": false
--   },
--   ...
-- ]

-- NOTE: After verifying the migration worked correctly:
-- 1. You can drop the old table: DROP TABLE package_date_availability;
-- 2. You can drop the view if exists: DROP VIEW IF EXISTS package_availability_view;
