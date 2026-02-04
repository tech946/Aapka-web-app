ALTER TABLE packages ADD COLUMN IF NOT EXISTS min_adults INTEGER NOT NULL DEFAULT 1;

ALTER TABLE packages ADD CONSTRAINT check_min_adults_positive CHECK (min_adults >= 1);

UPDATE packages p
SET min_adults = 2
WHERE EXISTS (
  SELECT 1 FROM package_categories pc 
  WHERE pc.id = p.package_category_id 
  AND (LOWER(pc.name) LIKE '%flexible%' OR LOWER(pc.name) LIKE '%offer%')
);

CREATE INDEX IF NOT EXISTS idx_packages_min_adults ON packages(min_adults);
