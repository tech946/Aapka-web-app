-- Create default_search_properties table
-- This table stores the default properties that appear in the search page

CREATE TABLE IF NOT EXISTS default_search_properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    
    -- Ensure unique property per user (if needed)
    UNIQUE(property_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_default_search_properties_property_id ON default_search_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_default_search_properties_active ON default_search_properties(is_active);
CREATE INDEX IF NOT EXISTS idx_default_search_properties_order ON default_search_properties(display_order);

-- Add RLS (Row Level Security) policies
ALTER TABLE default_search_properties ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read all default search properties
CREATE POLICY "Allow authenticated users to read default search properties" ON default_search_properties
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for admin users to manage default search properties
CREATE POLICY "Allow admin users to manage default search properties" ON default_search_properties
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_default_search_properties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_default_search_properties_updated_at
    BEFORE UPDATE ON default_search_properties
    FOR EACH ROW
    EXECUTE FUNCTION update_default_search_properties_updated_at();
