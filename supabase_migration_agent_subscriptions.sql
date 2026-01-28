-- Migration: Create subscriptions and agents tables for agent registration system
-- Run this in your Supabase SQL Editor

-- 1. Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_type TEXT NOT NULL DEFAULT 'agent_premium',
  amount_paid DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'AED',
  payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  payment_transaction_id TEXT,
  payment_gateway TEXT, -- 'ccavenue', 'hdfc', etc.
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL, -- start_date + 1 year
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  resident_country TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_is_active ON subscriptions(is_active, end_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_status ON subscriptions(payment_status);
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_email ON agents(email);
CREATE INDEX IF NOT EXISTS idx_agents_is_active ON agents(is_active);

-- 4. Add function to update updated_at timestamp for subscriptions
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Add function to update updated_at timestamp for agents
CREATE OR REPLACE FUNCTION update_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create triggers
CREATE TRIGGER trigger_update_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_subscriptions_updated_at();

CREATE TRIGGER trigger_update_agents_updated_at
BEFORE UPDATE ON agents
FOR EACH ROW
EXECUTE FUNCTION update_agents_updated_at();

-- 7. Helper function to check if user has active agent subscription
CREATE OR REPLACE FUNCTION has_active_agent_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM subscriptions s
    INNER JOIN agents a ON a.user_id = s.user_id
    WHERE s.user_id = user_uuid
      AND s.payment_status = 'completed'
      AND s.is_active = true
      AND s.end_date > NOW()
      AND a.is_active = true
  );
END;
$$ LANGUAGE plpgsql;
