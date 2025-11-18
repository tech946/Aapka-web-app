-- Create bookings table for storing booking/payment information
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Package information (array of package IDs for multiple bookings)
  package_ids TEXT[] NOT NULL,
  
  -- Pricing information
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- Payment information
  payment_method TEXT NOT NULL, -- 'card', 'wallet', etc.
  payment_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  payment_transaction_id TEXT, -- Transaction ID from payment gateway
  
  -- Booking status
  booking_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
  
  -- Passenger information (JSONB for flexible structure)
  passengers JSONB NOT NULL,
  /*
  Example structure:
  [
    {
      "salutation": "Mr",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "whatsapp": "+1234567890",
      "country": "India",
      "pickupLocation": "Hotel ABC",
      "permanentAddress": "123 Main St",
      "passportExpiry": "2025-12-31",
      "nationality": "Indian",
      "documents": {
        "applicantPhoto": "https://cloudinary.com/...",
        "passportMainCopy": "https://cloudinary.com/...",
        "passportLastPage": "https://cloudinary.com/...",
        "nationalIdCard": "https://cloudinary.com/..."
      }
    }
  ]
  */
  
  -- Cart items snapshot (for reference)
  cart_items JSONB NOT NULL,
  /*
  Example structure:
  [
    {
      "packageId": "uuid",
      "adults": 2,
      "children": 1,
      "selectedDate": "2024-12-25"
    }
  ]
  */
  
  -- Additional metadata
  notes TEXT, -- Admin notes
  customer_notes TEXT, -- Customer notes/requests
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for better query performance
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  CONSTRAINT valid_booking_status CHECK (booking_status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  CONSTRAINT valid_payment_method CHECK (payment_method IN ('card', 'wallet', 'cash', 'other'))
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_package_ids ON bookings USING GIN(package_ids);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE bookings IS 'Stores all booking and payment information for package bookings';
COMMENT ON COLUMN bookings.package_ids IS 'Array of package IDs for multiple package bookings';
COMMENT ON COLUMN bookings.passengers IS 'JSONB array containing all passenger information and document URLs';
COMMENT ON COLUMN bookings.cart_items IS 'Snapshot of cart items at time of booking';
COMMENT ON COLUMN bookings.payment_status IS 'Current status of payment: pending, completed, failed, refunded';
COMMENT ON COLUMN bookings.booking_status IS 'Current status of booking: pending, confirmed, cancelled, completed';

