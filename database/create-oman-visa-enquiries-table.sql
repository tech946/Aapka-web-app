-- Create oman_visa_enquiries table for Oman visa applications from website
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New query → Run
-- Use the Supabase project connected to your web app (NEXT_PUBLIC_SUPABASE_URL)

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

CREATE INDEX IF NOT EXISTS idx_oman_visa_enquiries_created_at ON oman_visa_enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oman_visa_enquiries_status ON oman_visa_enquiries(status);

ALTER TABLE oman_visa_enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to oman_visa_enquiries" ON oman_visa_enquiries;
CREATE POLICY "Service role full access to oman_visa_enquiries"
  ON oman_visa_enquiries
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
