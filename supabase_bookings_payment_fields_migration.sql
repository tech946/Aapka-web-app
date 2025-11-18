-- Add payment fields to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS payment_amount_currency TEXT DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS payment_type TEXT CHECK (payment_type IN ('half', 'full')),
ADD COLUMN IF NOT EXISTS payment_gateway TEXT CHECK (payment_gateway IN ('hdfc', 'ccavenue')),
ADD COLUMN IF NOT EXISTS payment_done TEXT CHECK (payment_done IN ('half', 'full'));

-- Add comments
COMMENT ON COLUMN bookings.payment_amount IS 'Amount paid in the payment currency';
COMMENT ON COLUMN bookings.payment_amount_currency IS 'Currency of the payment (INR for both gateways)';
COMMENT ON COLUMN bookings.payment_type IS 'Type of payment selected: half or full';
COMMENT ON COLUMN bookings.payment_gateway IS 'Payment gateway used: razorpay or ccavenue';
COMMENT ON COLUMN bookings.payment_done IS 'Payment status: half or full payment completed';

