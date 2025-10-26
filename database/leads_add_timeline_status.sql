-- Add timeline status tracking to leads table
-- This will track the 5 stages: lead_submitted, call_scheduled, site_visit_done, booking_confirm, commission_released

-- Add timeline_status column to track current stage
ALTER TABLE leads ADD COLUMN IF NOT EXISTS timeline_status VARCHAR(50) DEFAULT 'lead_submitted';

-- Add timeline_dates JSONB column to store dates for each stage
ALTER TABLE leads ADD COLUMN IF NOT EXISTS timeline_dates JSONB DEFAULT '{
  "lead_submitted": null,
  "call_scheduled": null,
  "site_visit_done": null,
  "booking_confirm": null,
  "commission_released": null
}'::jsonb;

-- Add notification_sent JSONB column to track which notifications have been sent
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notification_sent JSONB DEFAULT '{
  "lead_submitted": false,
  "call_scheduled": false,
  "site_visit_done": false,
  "booking_confirm": false,
  "commission_released": false
}'::jsonb;

-- Create index for timeline_status
CREATE INDEX IF NOT EXISTS idx_leads_timeline_status ON leads(timeline_status);

-- Update existing leads to have lead_submitted date set to created_at
UPDATE leads 
SET timeline_dates = jsonb_set(
  timeline_dates, 
  '{lead_submitted}', 
  to_jsonb(created_at::text)
)
WHERE timeline_dates->>'lead_submitted' IS NULL;

-- Create function to update timeline status and dates
CREATE OR REPLACE FUNCTION update_lead_timeline_status(
  lead_id UUID,
  new_status VARCHAR(50)
) RETURNS VOID AS $$
BEGIN
  -- Update the timeline status
  UPDATE leads 
  SET 
    timeline_status = new_status,
    timeline_dates = jsonb_set(
      timeline_dates, 
      ARRAY[new_status], 
      to_jsonb(NOW()::text)
    ),
    updated_at = NOW()
  WHERE id = lead_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if notification should be sent
CREATE OR REPLACE FUNCTION should_send_notification(
  lead_id UUID,
  status VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
  notification_sent_value BOOLEAN;
BEGIN
  SELECT (notification_sent->>status)::boolean 
  INTO notification_sent_value
  FROM leads 
  WHERE id = lead_id;
  
  RETURN COALESCE(notification_sent_value, false) = false;
END;
$$ LANGUAGE plpgsql;

-- Create function to mark notification as sent
CREATE OR REPLACE FUNCTION mark_notification_sent(
  lead_id UUID,
  status VARCHAR(50)
) RETURNS VOID AS $$
BEGIN
  UPDATE leads 
  SET notification_sent = jsonb_set(
    notification_sent, 
    ARRAY[status], 
    'true'::jsonb
  )
  WHERE id = lead_id;
END;
$$ LANGUAGE plpgsql;
