-- Add passport validity confirmation to oman_transport_enquiries

ALTER TABLE oman_transport_enquiries
ADD COLUMN IF NOT EXISTS passport_validity_accepted BOOLEAN NOT NULL DEFAULT false;
