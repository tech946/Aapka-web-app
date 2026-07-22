-- LTD: raise default daily seat cap from 46 → 48 (product expectation).
-- Bookings columns used for seat math: limited_time_deal_id, payment_status,
-- payment_transaction_id, booking_status, payment_done, cart_items (JSONB).
--
ALTER TABLE limited_time_deals
  ALTER COLUMN max_bookings_per_day SET DEFAULT 48;

-- One-time: align existing rows still on legacy default 46 → 48. If a deal must stay at 46, set it back in dashboard/SQL after migrate.
UPDATE limited_time_deals SET max_bookings_per_day = 48 WHERE max_bookings_per_day = 46;

COMMENT ON COLUMN limited_time_deals.max_bookings_per_day IS
  'Max seats (passengers) per travel date for this deal; remaining = this minus paid LTD bookings only (see app: getLtdOccupiedSeatsByDate).';

-- payment_done is set by CCAvenue/HDFC success callbacks (full/half); pending checkouts leave it NULL.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'payment_done'
  ) THEN
    ALTER TABLE bookings ADD COLUMN payment_done TEXT;
  END IF;
END $$;
