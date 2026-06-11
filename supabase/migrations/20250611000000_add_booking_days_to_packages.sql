-- Weekday availability for UAE tours (0 = Sunday .. 6 = Saturday). NULL = all days allowed.
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS booking_days JSONB DEFAULT NULL;

COMMENT ON COLUMN packages.booking_days IS 'Array of weekday numbers (0=Sun..6=Sat) when a tour can be booked. NULL = all days allowed.';
