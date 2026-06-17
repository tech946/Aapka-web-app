-- Replace booking_slots with explicit bookable dates array
ALTER TABLE marina_cruise_dinners
  ADD COLUMN IF NOT EXISTS bookable_dates TEXT[];
