-- Any-date packages: how many days before a hotel surcharge range are also unbookable.
-- Example with the default of 3: a 6 Nov - 10 Nov surcharge blocks 3 Nov - 10 Nov.

ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS surcharge_block_days_before INTEGER NOT NULL DEFAULT 3;

ALTER TABLE packages
  DROP CONSTRAINT IF EXISTS packages_surcharge_block_days_before_range;

ALTER TABLE packages
  ADD CONSTRAINT packages_surcharge_block_days_before_range
  CHECK (surcharge_block_days_before >= 0 AND surcharge_block_days_before <= 90);

COMMENT ON COLUMN packages.surcharge_block_days_before IS
  'Any-date packages: days before a surcharge_master range that are also blocked in the booking calendar';
