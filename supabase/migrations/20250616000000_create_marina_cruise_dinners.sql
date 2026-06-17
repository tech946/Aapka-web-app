-- Marina Cruise Dinner — simplified standalone table
CREATE TABLE IF NOT EXISTS marina_cruise_dinners (
  package_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  package_name TEXT NOT NULL,
  package_description TEXT,
  category TEXT,
  timing TEXT,
  package_price DECIMAL(10, 2),
  adult_price DECIMAL(10, 2),
  child_price DECIMAL(10, 2),
  booking_slots JSONB,
  booking_days INTEGER[],
  bookable_dates TEXT[],
  pickup_location TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  show_listing_page BOOLEAN NOT NULL DEFAULT true,
  terms_html TEXT,
  inclusion_html TEXT,
  exclusion_html TEXT,
  overview TEXT,
  holiday_description_html TEXT,
  thumbnail_image TEXT,
  gallery JSONB,
  crm_package_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marina_cruise_dinners_status ON marina_cruise_dinners(status);
CREATE INDEX IF NOT EXISTS idx_marina_cruise_dinners_created_at ON marina_cruise_dinners(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marina_cruise_dinners_show_listing ON marina_cruise_dinners(show_listing_page);
