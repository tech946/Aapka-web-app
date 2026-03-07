-- Migration: Create pdf_enquiries table for PDF brochure download requests
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

CREATE TABLE IF NOT EXISTS pdf_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(50) NOT NULL,
  package_id VARCHAR(255),
  package_name VARCHAR(500),
  pdf_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pdf_enquiries_created_at ON pdf_enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pdf_enquiries_email ON pdf_enquiries(email);

ALTER TABLE pdf_enquiries ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (dashboard uses supabaseAdmin)
DROP POLICY IF EXISTS "Service role full access to pdf_enquiries" ON pdf_enquiries;
CREATE POLICY "Service role full access to pdf_enquiries"
  ON pdf_enquiries
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
