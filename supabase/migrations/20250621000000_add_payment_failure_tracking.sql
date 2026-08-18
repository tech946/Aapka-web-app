ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_failure_reason TEXT,
  ADD COLUMN IF NOT EXISTS payment_failure_code TEXT,
  ADD COLUMN IF NOT EXISTS payment_failed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_gateway_response JSONB;

COMMENT ON COLUMN bookings.payment_failure_reason IS
  'Human-readable reason from the gateway (failure_message / status_message)';
COMMENT ON COLUMN bookings.payment_failure_code IS
  'Raw gateway order_status: Failure, Aborted, Invalid, Timeout';
COMMENT ON COLUMN bookings.payment_failed_at IS
  'When the unsuccessful outcome was recorded';
COMMENT ON COLUMN bookings.payment_gateway_response IS
  'Whitelisted, non-sensitive gateway fields kept for auditing. Never contains card data.';


DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace ns ON ns.oid = rel.relnamespace
    WHERE rel.relname = 'bookings'
      AND ns.nspname = 'public'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%payment_status%'
  LOOP
    EXECUTE format('ALTER TABLE bookings DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE bookings
  ADD CONSTRAINT bookings_payment_status_check
  CHECK (
    payment_status IS NULL
    OR payment_status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')
  );

CREATE INDEX IF NOT EXISTS idx_bookings_payment_status
  ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_failed_at
  ON bookings(payment_failed_at);
