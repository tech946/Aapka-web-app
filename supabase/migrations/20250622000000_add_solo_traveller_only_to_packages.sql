-- Add solo_traveller_only column to packages table
--
-- Offer packages can already opt into an *optional* solo traveller rate via
-- solo_traveller_enabled / solo_traveller_price. This flag is the stricter
-- variant: when true the package is sold to solo travellers ONLY, so the
-- marketing listing/detail pages show just the solo price, the booking modal
-- drops the adult/child/infant counters, and the min_adults rule is bypassed
-- (a solo booking is always exactly 1 adult).
--
-- Defaults to false so every existing package keeps its current behaviour.

ALTER TABLE packages ADD COLUMN IF NOT EXISTS solo_traveller_only BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN packages.solo_traveller_only IS 'When true, the package is bookable by solo travellers only: only the solo price is shown and adult/child/infant selection + min_adults are bypassed. Requires solo_traveller_enabled = true.';
