-- Migration: Update agent_discount from value to percentage
-- Run this in your Supabase SQL Editor

-- Step 1: Update the column comment to reflect percentage instead of value
COMMENT ON COLUMN packages.agent_discount IS 'Discount percentage (%) for agents with active subscription. Applied to total price: total_price * (1 - agent_discount / 100)';

-- Note: The column type remains DECIMAL(10, 2) which can store percentage values (e.g., 10.50 for 10.5%)
-- If you have existing data, you may want to convert it:
-- For example, if you had a discount of 50 AED and the average package price is 1000 AED, 
-- the percentage would be: (50 / 1000) * 100 = 5%
-- 
-- Example conversion query (uncomment and adjust based on your data):
-- UPDATE packages
-- SET agent_discount = CASE
--   WHEN agent_discount IS NOT NULL AND package_price > 0 
--   THEN (agent_discount / package_price) * 100
--   ELSE NULL
-- END
-- WHERE agent_discount IS NOT NULL;
