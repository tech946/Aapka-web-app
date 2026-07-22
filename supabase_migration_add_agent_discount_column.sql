-- Add agent discount column to packages table
-- This discount is exclusive to agents who have active subscriptions
-- Applied to the total price: total_price - agent_discount

ALTER TABLE packages
ADD COLUMN IF NOT EXISTS agent_discount DECIMAL(10, 2) DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN packages.agent_discount IS 'Discount amount (AED) for agents with active subscription. Applied to total price: total_price - agent_discount';
