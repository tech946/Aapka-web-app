-- Migration: Create agent referral and commission system tables
-- Run this in your Supabase SQL Editor

-- 1. Create agent_referrals table
CREATE TABLE IF NOT EXISTS agent_referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  referral_code_hash TEXT NOT NULL UNIQUE, -- SHA256 hash of referral code for lookup
  package_id UUID REFERENCES packages(package_id) ON DELETE SET NULL, -- Optional: specific package
  discount_applied BOOLEAN NOT NULL DEFAULT false,
  customer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Set when customer registers/logs in
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL, -- Set when booking completed
  commission_amount DECIMAL(10, 2), -- Calculated commission amount
  status TEXT NOT NULL DEFAULT 'active', -- active, pending_commission, commission_pending, completed, cancelled, rejected
  rejection_reason TEXT, -- Reason if rejected
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create agent_commissions table
CREATE TABLE IF NOT EXISTS agent_commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL REFERENCES agent_referrals(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AED',
  commission_rate DECIMAL(5, 2) NOT NULL DEFAULT 10.00, -- Percentage (e.g., 10.00 for 10%)
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, paid, reversed, cancelled
  reversal_reason TEXT, -- Reason if reversed
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create agent_wallet table
CREATE TABLE IF NOT EXISTS agent_wallet (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  commission_id UUID REFERENCES agent_commissions(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL, -- Can be positive (credit) or negative (debit)
  currency TEXT NOT NULL DEFAULT 'AED',
  balance_type TEXT NOT NULL DEFAULT 'available', -- available, pending, withdrawn
  transaction_type TEXT NOT NULL, -- commission, commission_reversal, withdrawal, refund
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_agent_referrals_code_hash ON agent_referrals(referral_code_hash);
CREATE INDEX IF NOT EXISTS idx_agent_referrals_agent_id ON agent_referrals(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_referrals_booking_id ON agent_referrals(booking_id);
CREATE INDEX IF NOT EXISTS idx_agent_referrals_status ON agent_referrals(status);
CREATE INDEX IF NOT EXISTS idx_agent_referrals_expires_at ON agent_referrals(expires_at);

CREATE INDEX IF NOT EXISTS idx_agent_commissions_agent_id ON agent_commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_referral_id ON agent_commissions(referral_id);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_booking_id ON agent_commissions(booking_id);
CREATE INDEX IF NOT EXISTS idx_agent_commissions_status ON agent_commissions(status);

CREATE INDEX IF NOT EXISTS idx_agent_wallet_agent_id ON agent_wallet(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_wallet_commission_id ON agent_wallet(commission_id);
CREATE INDEX IF NOT EXISTS idx_agent_wallet_balance_type ON agent_wallet(balance_type);

-- 5. Create function to update updated_at timestamp for agent_referrals
CREATE OR REPLACE FUNCTION update_agent_referrals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to update updated_at timestamp for agent_commissions
CREATE OR REPLACE FUNCTION update_agent_commissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create triggers
CREATE TRIGGER trigger_update_agent_referrals_updated_at
BEFORE UPDATE ON agent_referrals
FOR EACH ROW
EXECUTE FUNCTION update_agent_referrals_updated_at();

CREATE TRIGGER trigger_update_agent_commissions_updated_at
BEFORE UPDATE ON agent_commissions
FOR EACH ROW
EXECUTE FUNCTION update_agent_commissions_updated_at();

-- 8. Add referral_id column to bookings table (if not exists)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS referral_id UUID REFERENCES agent_referrals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_referral_id ON bookings(referral_id);

-- 9. Add comments for documentation
COMMENT ON TABLE agent_referrals IS 'Tracks agent referral links and their status';
COMMENT ON TABLE agent_commissions IS 'Tracks commission payments to agents from referrals';
COMMENT ON TABLE agent_wallet IS 'Tracks agent wallet balance and transactions';
COMMENT ON COLUMN agent_referrals.referral_code_hash IS 'SHA256 hash of the referral code for secure lookup';
COMMENT ON COLUMN agent_referrals.discount_applied IS 'If true, customer gets discount and agent gets no commission. If false, customer pays full price and agent gets commission';
COMMENT ON COLUMN agent_commissions.commission_rate IS 'Commission percentage (e.g., 10.00 for 10%)';
COMMENT ON COLUMN agent_wallet.amount IS 'Can be positive (credit) or negative (debit)';
