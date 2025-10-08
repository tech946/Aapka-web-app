-- Migration to simplify developers table
-- Remove unnecessary columns: email, phone, website, address, country_id

-- First, drop the foreign key constraint if it exists
ALTER TABLE developers DROP CONSTRAINT IF EXISTS developers_country_id_fkey;

-- Drop the index on country_id if it exists
DROP INDEX IF EXISTS idx_developers_country_id;

-- Remove the unnecessary columns
ALTER TABLE developers DROP COLUMN IF EXISTS email;
ALTER TABLE developers DROP COLUMN IF EXISTS phone;
ALTER TABLE developers DROP COLUMN IF EXISTS website;
ALTER TABLE developers DROP COLUMN IF EXISTS address;
ALTER TABLE developers DROP COLUMN IF EXISTS country_id;

-- The simplified developers table now only contains:
-- - id (UUID, primary key)
-- - name (VARCHAR, required)
-- - description (TEXT, optional)
-- - image_url (TEXT, optional)
-- - is_active (BOOLEAN, default true)
-- - created_at (TIMESTAMP)
-- - updated_at (TIMESTAMP)
