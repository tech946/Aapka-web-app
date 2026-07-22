-- Migration: Add referral_id column to bookings table and create increment function
-- Run this in your Supabase SQL Editor

-- Step 1: Add referral_id column to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS referral_id UUID REFERENCES agent_referrals(id) ON DELETE SET NULL;

-- Step 2: Create index for faster queries on referral_id
CREATE INDEX IF NOT EXISTS idx_bookings_referral_id ON bookings(referral_id);

-- Step 3: Create function to increment referral usage count
-- This function is called when a booking is created with a referral
CREATE OR REPLACE FUNCTION increment_referral_usage(referral_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE agent_referrals
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = referral_id
  RETURNING usage_count INTO new_count;
  
  RETURN COALESCE(new_count, 1);
END;
$$ LANGUAGE plpgsql;

-- Step 4: Add comment to explain the column
COMMENT ON COLUMN bookings.referral_id IS 'Reference to agent_referrals table for tracking which agent referral led to this booking';
