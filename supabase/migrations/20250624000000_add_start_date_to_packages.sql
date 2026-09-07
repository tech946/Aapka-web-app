-- Any-date packages: first date the package can be booked for.
-- Dates before it are closed off in the booking calendar, the same way
-- dates after end_date already are. NULL means no start restriction.

ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS start_date DATE;

COMMENT ON COLUMN packages.start_date IS
  'Any-date packages: earliest bookable travel date; dates before it are blocked in the booking calendar';
