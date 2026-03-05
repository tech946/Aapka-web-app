-- Influencer Referral System
-- Invite-only influencer portal, separate from CRM
-- Run in Supabase SQL Editor or via migration

-- 1. Influencer profiles (separate from CRM profiles)
CREATE TABLE IF NOT EXISTS influencers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  invited_by UUID,
  bank_account_name TEXT,
  bank_account_number TEXT,
  ifsc_code TEXT,
  upi_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_influencers_auth_user ON influencers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_influencers_email ON influencers(email);
CREATE INDEX IF NOT EXISTS idx_influencers_status ON influencers(status);

-- 2. Invitation system (invite-only, no open signup)
CREATE TABLE IF NOT EXISTS influencer_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  invited_by UUID,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_influencer_invitations_token ON influencer_invitations(token);
CREATE INDEX IF NOT EXISTS idx_influencer_invitations_email ON influencer_invitations(email);
CREATE INDEX IF NOT EXISTS idx_influencer_invitations_status ON influencer_invitations(status);

-- 3. Commission settings per package (set from CRM dashboard)
CREATE TABLE IF NOT EXISTS referral_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('package', 'tour', 'addon')),
  entity_id UUID NOT NULL,
  commission_percent NUMERIC(5,2) NOT NULL CHECK (commission_percent >= 0 AND commission_percent <= 100),
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_commissions_entity ON referral_commissions(entity_type, entity_id);

-- 4. Influencer referral links (unique per influencer + package)
CREATE TABLE IF NOT EXISTS influencer_referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  clicks INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(influencer_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_influencer_referral_links_code ON influencer_referral_links(referral_code);
CREATE INDEX IF NOT EXISTS idx_influencer_referral_links_influencer ON influencer_referral_links(influencer_id);

-- 5. Track referral visits/clicks
CREATE TABLE IF NOT EXISTS referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code TEXT NOT NULL,
  visitor_ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_clicks_code ON referral_clicks(referral_code);

-- 6. Referral conversions (when referred customer pays)
CREATE TABLE IF NOT EXISTS referral_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code TEXT NOT NULL,
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  booking_id UUID,
  payment_amount NUMERIC(12,2) NOT NULL,
  commission_percent NUMERIC(5,2) NOT NULL,
  commission_amount NUMERIC(12,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_conversions_influencer ON referral_conversions(influencer_id);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_status ON referral_conversions(status);
CREATE INDEX IF NOT EXISTS idx_referral_conversions_booking ON referral_conversions(booking_id);

-- 7. Influencer wallet (running balance)
CREATE TABLE IF NOT EXISTS influencer_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE UNIQUE,
  total_earned NUMERIC(12,2) DEFAULT 0,
  total_withdrawn NUMERIC(12,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add computed available_balance (PostgreSQL doesn't have GENERATED for expressions with multiple columns, so we use a view or compute in app)
-- For simplicity: available_balance = total_earned - total_withdrawn (computed in application)

-- 8. Withdrawal requests
CREATE TABLE IF NOT EXISTS influencer_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  bank_account_name TEXT,
  bank_account_number TEXT,
  ifsc_code TEXT,
  upi_id TEXT,
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'upi')),
  admin_notes TEXT,
  processed_by UUID,
  processed_at TIMESTAMPTZ,
  requested_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_influencer_withdrawals_influencer ON influencer_withdrawals(influencer_id);
CREATE INDEX IF NOT EXISTS idx_influencer_withdrawals_status ON influencer_withdrawals(status);

-- 9. Add influencer_referral_code to bookings (if column doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'influencer_referral_code'
  ) THEN
    ALTER TABLE bookings ADD COLUMN influencer_referral_code TEXT;
    CREATE INDEX IF NOT EXISTS idx_bookings_influencer_referral ON bookings(influencer_referral_code);
  END IF;
END $$;
