-- Add solo_room_type column to packages table
--
-- A package that sells a solo traveller rate can put that traveller in a
-- shared room or a private one. When the room is shared the booking modal
-- asks the traveller to confirm they are comfortable sharing, and that
-- confirmation is required before the package can be added to the cart.
-- When the room is private there is nobody to share with, so the modal does
-- not show the confirmation at all and does not require it.
--
-- Defaults to 'shared' so every existing package keeps its current behaviour.

ALTER TABLE packages ADD COLUMN IF NOT EXISTS solo_room_type TEXT NOT NULL DEFAULT 'shared';

ALTER TABLE packages DROP CONSTRAINT IF EXISTS check_solo_room_type;
ALTER TABLE packages ADD CONSTRAINT check_solo_room_type CHECK (solo_room_type IN ('private', 'shared'));

COMMENT ON COLUMN packages.solo_room_type IS 'Room sold to a solo traveller: shared (booking modal shows and requires the room-sharing confirmation) or private (confirmation hidden and not required).';
