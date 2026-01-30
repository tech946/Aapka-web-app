-- Migration: Add agent_code column to agents table
-- Run this in your Supabase SQL Editor

-- Step 1: Add agent_code column to agents table
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS agent_code TEXT UNIQUE;

-- Step 2: Create index for faster queries on agent_code
CREATE INDEX IF NOT EXISTS idx_agents_agent_code ON agents(agent_code);

-- Step 3: Generate agent codes for existing agents that don't have one
-- This uses a function to generate unique codes
DO $$
DECLARE
  agent_record RECORD;
  new_code TEXT;
  code_exists BOOLEAN;
  attempt_count INTEGER;
  max_attempts INTEGER := 10;
BEGIN
  -- Loop through all agents without agent_code
  FOR agent_record IN 
    SELECT id FROM agents WHERE agent_code IS NULL
  LOOP
    attempt_count := 0;
    code_exists := true;
    
    -- Generate unique code
    WHILE code_exists AND attempt_count < max_attempts LOOP
      -- Generate code: AGT-XXXXXX (6 random alphanumeric characters)
      new_code := 'AGT-' || upper(
        substr(
          md5(random()::text || agent_record.id::text || clock_timestamp()::text),
          1,
          6
        )
      );
      
      -- Check if code already exists
      SELECT EXISTS(SELECT 1 FROM agents WHERE agent_code = new_code) INTO code_exists;
      
      IF NOT code_exists THEN
        -- Update agent with new code
        UPDATE agents 
        SET agent_code = new_code 
        WHERE id = agent_record.id;
        
        RAISE NOTICE 'Generated agent code % for agent %', new_code, agent_record.id;
        EXIT; -- Exit the loop
      END IF;
      
      attempt_count := attempt_count + 1;
    END LOOP;
    
    -- If max attempts reached, use timestamp-based code
    IF code_exists THEN
      new_code := 'AGT-' || upper(substr(to_char(extract(epoch from now())::bigint, 'FM999999999999'), -6));
      UPDATE agents 
      SET agent_code = new_code 
      WHERE id = agent_record.id;
      RAISE NOTICE 'Generated fallback agent code % for agent %', new_code, agent_record.id;
    END IF;
  END LOOP;
END $$;

-- Step 4: Add NOT NULL constraint after generating codes for existing records
-- (Optional - uncomment if you want to enforce agent_code for all future agents)
-- ALTER TABLE agents
-- ALTER COLUMN agent_code SET NOT NULL;

-- Step 5: Verify the migration
-- Run this to check:
-- SELECT id, email, full_name, agent_code, created_at 
-- FROM agents 
-- ORDER BY created_at DESC 
-- LIMIT 10;
