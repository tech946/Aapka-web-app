-- Add child_amount and infant_amount columns to packages table
ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS child_amount DECIMAL(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS infant_amount DECIMAL(10,2) DEFAULT NULL;
