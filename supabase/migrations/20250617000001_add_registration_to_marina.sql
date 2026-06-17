-- Registration-only option with separate adult/child pricing
ALTER TABLE marina_cruise_dinners
  ADD COLUMN IF NOT EXISTS registration_only BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS registration_adult_price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS registration_child_price DECIMAL(10, 2);
