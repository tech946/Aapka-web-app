-- Migration: Add link_type column to agent_referrals for secure discount control
-- The discount is determined by the link type stored in DB, NOT by URL parameters
-- Run this in your Supabase SQL Editor

-- Step 1: Add link_type column to control whether discount is applied
-- 'discount' = customer sees discounted price, agent gives up commission
-- 'commission' = customer sees full price, agent earns commission on sale
ALTER TABLE agent_referrals
ADD COLUMN IF NOT EXISTS link_type TEXT NOT NULL DEFAULT 'commission'
CHECK (link_type IN ('discount', 'commission'));

-- Step 2: Add discount_percentage column to store the discount at time of creation
-- This prevents issues if package discount % changes after link is created
ALTER TABLE agent_referrals
ADD COLUMN IF NOT EXISTS discount_percentage DECIMAL(5, 2) DEFAULT 0;

-- Step 3: Add usage tracking columns
ALTER TABLE agent_referrals
ADD COLUMN IF NOT EXISTS usage_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE agent_referrals
ADD COLUMN IF NOT EXISTS max_uses INTEGER DEFAULT NULL; -- NULL = unlimited

-- Step 4: Add package-specific fields for tracking
ALTER TABLE agent_referrals
ADD COLUMN IF NOT EXISTS package_name TEXT;

-- Step 5: Add referral_code column to store the original code (for display purposes)
-- The hash is still used for lookups, but we need the code for agent dashboard
ALTER TABLE agent_referrals
ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Step 6: Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_agent_referrals_link_type ON agent_referrals(link_type);
CREATE INDEX IF NOT EXISTS idx_agent_referrals_package_id_agent ON agent_referrals(package_id, agent_id);

-- Step 7: Add comment explaining the columns
COMMENT ON COLUMN agent_referrals.link_type IS 'Type of referral link: discount (customer gets discount, no commission) or commission (full price, agent earns commission)';
COMMENT ON COLUMN agent_referrals.discount_percentage IS 'Discount percentage locked at time of link creation';
COMMENT ON COLUMN agent_referrals.usage_count IS 'Number of times this referral has been used for bookings';
COMMENT ON COLUMN agent_referrals.max_uses IS 'Maximum allowed uses (NULL = unlimited)';
COMMENT ON COLUMN agent_referrals.referral_code IS 'Original referral code for display (hash is used for lookups)';
