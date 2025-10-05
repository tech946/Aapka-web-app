-- Leads table for managing customer leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fullname VARCHAR(255) NOT NULL,
  mobile_no VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  relationship VARCHAR(100) NOT NULL,
  budget DECIMAL(15,2) NOT NULL,
  purpose_of_buying TEXT NOT NULL,
  buying_timeline VARCHAR(100) NOT NULL,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'new', -- new, contacted, qualified, converted, lost
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);

-- Enable Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create policies for leads table
-- Policy for authenticated users to read all leads (for admin/web interface)
CREATE POLICY "Users can view all leads" ON leads
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert leads (for mobile submission)
CREATE POLICY "Users can insert leads" ON leads
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update leads (for status updates in web)
CREATE POLICY "Users can update leads" ON leads
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();
