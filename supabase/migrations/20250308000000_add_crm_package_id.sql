-- Migration: Add crm_package_id to packages table
-- Links website package to CRM package for itinerary display

ALTER TABLE packages ADD COLUMN IF NOT EXISTS crm_package_id TEXT NULL;

COMMENT ON COLUMN packages.crm_package_id IS 'Reference to CRM package id for fetching itinerary. When set, Customize Your Package shows CRM itinerary.';

CREATE INDEX IF NOT EXISTS idx_packages_crm_package_id ON packages(crm_package_id) WHERE crm_package_id IS NOT NULL;
