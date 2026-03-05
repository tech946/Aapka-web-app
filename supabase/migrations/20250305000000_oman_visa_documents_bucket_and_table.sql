-- Migration: Add documents bucket and oman_visa_enquiries table for Oman visa submissions
-- Run this if your web app uses a separate Supabase project from CRM
-- If web app and CRM share the same Supabase, this is safe to run (idempotent)

-- Documents bucket for Oman visa passport/photo uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  true,
  10485760,  -- 10MB
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = NULL;

-- Public read for documents (service role bypasses RLS for uploads)
DROP POLICY IF EXISTS "Public read access for documents" ON storage.objects;
CREATE POLICY "Public read access for documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

-- Oman visa enquiries table (create if not exists)
CREATE TABLE IF NOT EXISTS oman_visa_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name_as_per_passport VARCHAR(255),
  nationality VARCHAR(100),
  date_of_birth DATE,
  passport_number VARCHAR(50),
  passport_issue_date DATE,
  passport_expiry_date DATE,
  contact_number VARCHAR(50),
  email VARCHAR(255),
  current_address TEXT,
  expected_travel_date DATE,
  purpose_of_visit VARCHAR(100),
  duration_of_stay VARCHAR(50),
  passport_front_url TEXT,
  passport_inside_url TEXT,
  photograph_url TEXT,
  declaration_accepted BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add any missing columns (for projects that had older schema)
ALTER TABLE oman_visa_enquiries ADD COLUMN IF NOT EXISTS full_name_as_per_passport VARCHAR(255);
ALTER TABLE oman_visa_enquiries ADD COLUMN IF NOT EXISTS nationality VARCHAR(100);
ALTER TABLE oman_visa_enquiries ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE oman_visa_enquiries ADD COLUMN IF NOT EXISTS passport_number VARCHAR(50);
ALTER TABLE oman_visa_enquiries ADD COLUMN IF NOT EXISTS passport_issue_date DATE;
ALTER TABLE oman_visa_enquiries ADD COLUMN IF NOT EXISTS passport_expiry_date DATE;
ALTER TABLE oman_visa_enquiries ADD COLUMN IF NOT EXISTS contact_number VARCHAR(50);
ALTER TABLE oman_visa_enquiries ADD COLUMN IF NOT EXISTS current_address TEXT;
ALTER TABLE oman_visa_enquiries ADD COLUMN IF NOT EXISTS expected_travel_date DATE;
ALTER TABLE oman_visa_enquiries ADD COLUMN IF NOT EXISTS purpose_of_visit VARCHAR(100);
ALTER TABLE oman_visa_enquiries ADD COLUMN IF NOT EXISTS duration_of_stay VARCHAR(50);
ALTER TABLE oman_visa_enquiries ADD COLUMN IF NOT EXISTS passport_front_url TEXT;
ALTER TABLE oman_visa_enquiries ADD COLUMN IF NOT EXISTS passport_inside_url TEXT;
ALTER TABLE oman_visa_enquiries ADD COLUMN IF NOT EXISTS photograph_url TEXT;
ALTER TABLE oman_visa_enquiries ADD COLUMN IF NOT EXISTS declaration_accepted BOOLEAN DEFAULT false;
ALTER TABLE oman_visa_enquiries ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'new';
ALTER TABLE oman_visa_enquiries ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_oman_visa_enquiries_created_at ON oman_visa_enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oman_visa_enquiries_status ON oman_visa_enquiries(status);

ALTER TABLE oman_visa_enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to oman_visa_enquiries" ON oman_visa_enquiries;
CREATE POLICY "Service role full access to oman_visa_enquiries"
  ON oman_visa_enquiries
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
