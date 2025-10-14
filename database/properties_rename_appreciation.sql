-- Rename expected_appreciation column to earn_referral
ALTER TABLE properties 
RENAME COLUMN expected_appreciation TO earn_referral;

-- Update any existing data if needed (optional)
-- UPDATE properties SET earn_referral = expected_appreciation WHERE earn_referral IS NULL;

