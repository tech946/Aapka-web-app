-- Marina cruise: adult/child pricing, remove PDF brochure
ALTER TABLE marina_cruise_dinners
  ADD COLUMN IF NOT EXISTS adult_price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS child_price DECIMAL(10, 2),
  DROP COLUMN IF EXISTS pdf_url;

UPDATE marina_cruise_dinners
SET adult_price = package_price
WHERE adult_price IS NULL AND package_price IS NOT NULL;
