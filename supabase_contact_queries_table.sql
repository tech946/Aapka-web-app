-- Create contact_queries table for storing contact form submissions
CREATE TABLE IF NOT EXISTS contact_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contact Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Message
  message TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'new', -- 'new', 'contacted', 'resolved', 'archived'
  notes TEXT, -- Admin notes
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('new', 'contacted', 'resolved', 'archived'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contact_queries_status ON contact_queries(status);
CREATE INDEX IF NOT EXISTS idx_contact_queries_created_at ON contact_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_queries_email ON contact_queries(email);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contact_queries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_contact_queries_updated_at 
    BEFORE UPDATE ON contact_queries
    FOR EACH ROW 
    EXECUTE FUNCTION update_contact_queries_updated_at();

-- Add comments for documentation
COMMENT ON TABLE contact_queries IS 'Stores contact form submissions from the website';
COMMENT ON COLUMN contact_queries.status IS 'Current status: new, contacted, resolved, archived';
COMMENT ON COLUMN contact_queries.notes IS 'Admin notes for internal tracking';

