import { supabaseAdmin } from './supabase-admin';

/**
 * Generates a unique agent code in the format: AGT-XXXXXX
 * where XXXXXX is a 6-character alphanumeric string
 * 
 * @returns Promise<string> - A unique agent code
 */
export async function generateAgentCode(): Promise<string> {
  const prefix = 'AGT';
  const maxAttempts = 10; // Prevent infinite loops
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate a 6-character alphanumeric code
    const randomPart = generateRandomCode(6);
    const agentCode = `${prefix}-${randomPart}`;
    
    // Check if this code already exists
    const { data, error } = await supabaseAdmin
      .from('agents')
      .select('id')
      .eq('agent_code', agentCode)
      .maybeSingle();
    
    if (error) {
      console.error('[AGENT CODE] Error checking code uniqueness:', error);
      // If there's a database error, still try to return a code
      // The database constraint will catch duplicates
      return agentCode;
    }
    
    // If code doesn't exist, it's unique
    if (!data) {
      return agentCode;
    }
    
    // Code exists, try again
    console.log(`[AGENT CODE] Code ${agentCode} already exists, generating new one...`);
  }
  
  // Fallback: if all attempts failed, generate with timestamp
  const timestamp = Date.now().toString(36).toUpperCase().slice(-6);
  return `${prefix}-${timestamp}`;
}

/**
 * Generates a random alphanumeric code of specified length
 * 
 * @param length - Length of the code to generate
 * @returns string - Random alphanumeric code (uppercase)
 */
function generateRandomCode(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Generates agent codes for existing agents that don't have one
 * This is a utility function for migration purposes
 * 
 * @returns Promise<number> - Number of agents updated
 */
export async function generateAgentCodesForExistingAgents(): Promise<number> {
  // Fetch all agents without agent_code
  const { data: agents, error } = await supabaseAdmin
    .from('agents')
    .select('id')
    .is('agent_code', null);
  
  if (error) {
    console.error('[AGENT CODE] Error fetching agents:', error);
    return 0;
  }
  
  if (!agents || agents.length === 0) {
    console.log('[AGENT CODE] No agents need code generation');
    return 0;
  }
  
  console.log(`[AGENT CODE] Generating codes for ${agents.length} agents...`);
  
  let updated = 0;
  for (const agent of agents) {
    try {
      const agentCode = await generateAgentCode();
      
      const { error: updateError } = await supabaseAdmin
        .from('agents')
        .update({ agent_code: agentCode })
        .eq('id', agent.id);
      
      if (updateError) {
        console.error(`[AGENT CODE] Error updating agent ${agent.id}:`, updateError);
      } else {
        updated++;
        console.log(`[AGENT CODE] Generated code ${agentCode} for agent ${agent.id}`);
      }
    } catch (err) {
      console.error(`[AGENT CODE] Error generating code for agent ${agent.id}:`, err);
    }
  }
  
  console.log(`[AGENT CODE] Successfully generated codes for ${updated} agents`);
  return updated;
}
