-- Migration: Add infant_documents column to bookings table (if table exists)
-- Stores full document set for each infant (applicant photo, passport, pancard, birth certificate)
-- Safe to run even if bookings table does not exist yet

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'bookings'
  ) THEN
    ALTER TABLE bookings
    ADD COLUMN IF NOT EXISTS infant_documents JSONB DEFAULT '[]'::jsonb;
    COMMENT ON COLUMN bookings.infant_documents IS 'Array of document objects for each infant - applicantPhoto, passportMainCopy, passportLastPage, passportCover, nationalIdCard, birthCertificate';
  END IF;
END $$;
