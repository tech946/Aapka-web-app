-- SQL Schema for Flexible Date Packages Feature
-- Run this in your Supabase SQL Editor

-- 1. Create package_date_availability table to store date-specific pricing and availability
CREATE TABLE IF NOT EXISTS package_date_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES packages(package_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  adult_price DECIMAL(10, 2) NOT NULL,
  child_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  infant_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  available_seats INTEGER NOT NULL DEFAULT 45,
  is_sold_out BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(package_id, date)
);

-- 2. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_package_date_availability_package_id ON package_date_availability(package_id);
CREATE INDEX IF NOT EXISTS idx_package_date_availability_date ON package_date_availability(date);
CREATE INDEX IF NOT EXISTS idx_package_date_availability_package_date ON package_date_availability(package_id, date);

-- 3. Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_package_date_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_package_date_availability_updated_at
BEFORE UPDATE ON package_date_availability
FOR EACH ROW
EXECUTE FUNCTION update_package_date_availability_updated_at();

-- 5. Add function to reset seats daily (optional - can be called via cron job)
-- This function resets available_seats to 45 for dates that are not sold out
CREATE OR REPLACE FUNCTION reset_daily_seats()
RETURNS void AS $$
BEGIN
  UPDATE package_date_availability
  SET available_seats = 45
  WHERE is_sold_out = false
    AND date >= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 6. Update cart_items table to include selected_date for anydate packages tracking
-- (Assuming cart_items already exists, this just adds a comment)
-- The selected_date field should already exist if you're tracking dates for bookings

-- 7. Add function to reduce seats when a booking is confirmed
CREATE OR REPLACE FUNCTION reduce_package_seats(
  p_package_id UUID,
  p_date DATE,
  p_total_travellers INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_seats INTEGER;
BEGIN
  -- Get current available seats
  SELECT available_seats INTO current_seats
  FROM package_date_availability
  WHERE package_id = p_package_id AND date = p_date;
  
  -- Check if date exists and has enough seats
  IF current_seats IS NULL THEN
    RAISE EXCEPTION 'Date availability not found for package % on date %', p_package_id, p_date;
  END IF;
  
  IF current_seats < p_total_travellers THEN
    RAISE EXCEPTION 'Not enough seats available. Required: %, Available: %', p_total_travellers, current_seats;
  END IF;
  
  -- Reduce seats
  UPDATE package_date_availability
  SET available_seats = available_seats - p_total_travellers,
      is_sold_out = (available_seats - p_total_travellers) <= 0
  WHERE package_id = p_package_id AND date = p_date;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 8. Enable Row Level Security (RLS) if needed
ALTER TABLE package_date_availability ENABLE ROW LEVEL SECURITY;

-- 9. Create policy to allow authenticated users to read (adjust as needed)
CREATE POLICY "Allow public read access to package_date_availability"
ON package_date_availability
FOR SELECT
USING (true);

-- 10. Create policy to allow authenticated admins to modify (adjust based on your auth setup)
-- Note: You'll need to adjust this based on your authentication system
-- CREATE POLICY "Allow admin write access to package_date_availability"
-- ON package_date_availability
-- FOR ALL
-- USING (auth.role() = 'admin');

-- Example: Create a view to see package availability with package details
CREATE OR REPLACE VIEW package_availability_view AS
SELECT 
  pda.id,
  pda.package_id,
  p.package_name,
  pda.date,
  pda.adult_price,
  pda.child_price,
  pda.infant_price,
  pda.available_seats,
  pda.is_sold_out,
  CASE 
    WHEN pda.is_sold_out THEN 'Sold Out'
    WHEN pda.available_seats = 0 THEN 'Sold Out'
    WHEN pda.available_seats <= 5 THEN 'Few Seats Left'
    ELSE 'Available'
  END as availability_status
FROM package_date_availability pda
JOIN packages p ON p.package_id = pda.package_id
ORDER BY pda.date ASC;
