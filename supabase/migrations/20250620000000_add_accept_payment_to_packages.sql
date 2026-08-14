-- Per-package payment rule: does checkout allow the 50% option, or full only?
--
-- 'half' = customer may choose Half Payment (50%) or Full Payment  (default)
-- 'full' = only Full Payment is offered for any cart containing this package
--
-- Defaults to 'half' so every existing package keeps its current behaviour.
-- Note this is the package-level rule only; checkout ALSO forces full payment
-- for tours/marina cruise (by category) and for subscribed agents, so the
-- effective rule is "full if any of those say full".

ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS accept_payment TEXT NOT NULL DEFAULT 'half';

-- Guard against typos writing an unknown value
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'packages_accept_payment_check'
  ) THEN
    ALTER TABLE packages
      ADD CONSTRAINT packages_accept_payment_check
      CHECK (accept_payment IN ('full', 'half'));
  END IF;
END $$;

COMMENT ON COLUMN packages.accept_payment IS
  'Checkout payment rule for this package: half = customer may pay 50% or 100%; full = full payment only. Default half.';
