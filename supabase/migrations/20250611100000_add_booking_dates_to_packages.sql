-- Optional allow-list of bookable dates for tours (yyyy-MM-dd). NULL/empty = use booking_days instead.
ALTER TABLE packages
ADD COLUMN IF NOT EXISTS booking_dates JSONB DEFAULT NULL;

COMMENT ON COLUMN packages.booking_dates IS 'Optional array of yyyy-MM-dd dates when a tour can be booked. When set, only these dates are selectable on the frontend calendar.';
