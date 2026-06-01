-- Add show_listing_page column to packages table
-- When true, package appears on public category listing pages; when false, it is hidden

ALTER TABLE packages ADD COLUMN IF NOT EXISTS show_listing_page BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN packages.show_listing_page IS 'When true, package is shown on public listing pages (offer packages, flexible date packages)';
