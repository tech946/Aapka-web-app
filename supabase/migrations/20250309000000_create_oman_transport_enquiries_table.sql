-- Migration: Create oman_transport_enquiries table for Oman exit transportation bookings
-- Run this in Supabase SQL Editor if using manual migrations

CREATE TABLE IF NOT EXISTS oman_transport_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travelling_date DATE NOT NULL,
  lead_passenger_name VARCHAR(255) NOT NULL,
  whatsapp_number VARCHAR(50) NOT NULL,
  calling_number VARCHAR(50),
  email VARCHAR(255) NOT NULL,
  nationality VARCHAR(100) NOT NULL,
  status_in_uae VARCHAR(100) NOT NULL,
  oman_visa_status VARCHAR(255) NOT NULL,
  number_of_adults INTEGER NOT NULL DEFAULT 1,
  number_of_children INTEGER NOT NULL DEFAULT 0,
  flight_hotel_booking VARCHAR(255),
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oman_transport_enquiries_created_at ON oman_transport_enquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_oman_transport_enquiries_email ON oman_transport_enquiries(email);

ALTER TABLE oman_transport_enquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to oman_transport_enquiries" ON oman_transport_enquiries;
CREATE POLICY "Service role full access to oman_transport_enquiries"
  ON oman_transport_enquiries
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
