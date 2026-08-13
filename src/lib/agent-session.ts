// lib/agent-session.ts
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * Result of resolving the current request's session against the agent tables.
 *
 * `isAgent` only says an active `agents` row exists. Pricing and payment rules
 * must key off `hasActiveSubscription`, which additionally requires the linked
 * subscription to be paid, active and unexpired.
 */
export interface AgentSession {
  isAgent: boolean;
  hasActiveSubscription: boolean;
  agentId: string | null;
  subscriptionId: string | null;
}

const NO_AGENT: AgentSession = {
  isAgent: false,
  hasActiveSubscription: false,
  agentId: null,
  subscriptionId: null,
};

/**
 * Resolves agent status for a known auth user id.
 * Never throws - callers treat a failure as "not an agent" so pricing falls
 * back to public rates rather than erroring the whole request.
 */
export async function getAgentSessionForUser(
  userId: string
): Promise<AgentSession> {
  try {
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('id, subscription_id, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (agentError || !agent) return NO_AGENT;

    if (!agent.subscription_id) {
      return {
        isAgent: true,
        hasActiveSubscription: false,
        agentId: agent.id,
        subscriptionId: null,
      };
    }

    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, payment_status, is_active, end_date')
      .eq('id', agent.subscription_id)
      .single();

    if (subError || !subscription) {
      return {
        isAgent: true,
        hasActiveSubscription: false,
        agentId: agent.id,
        subscriptionId: null,
      };
    }

    const hasActiveSubscription =
      subscription.payment_status === 'completed' &&
      subscription.is_active === true &&
      new Date(subscription.end_date) > new Date();

    return {
      isAgent: true,
      hasActiveSubscription,
      agentId: agent.id,
      subscriptionId: subscription.id,
    };
  } catch (error) {
    console.error('[AGENT SESSION] Error resolving agent for user:', error);
    return NO_AGENT;
  }
}

/**
 * Resolves agent status from the cookies on the current request.
 * Single source of truth for "is the caller a subscribed agent" - used by
 * check-agent-status, cart validation and booking creation so the discount and
 * full-payment rules can never disagree with each other.
 */
export async function getAgentSession(): Promise<AgentSession> {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) return NO_AGENT;

    return await getAgentSessionForUser(session.user.id);
  } catch (error) {
    console.error('[AGENT SESSION] Error reading session:', error);
    return NO_AGENT;
  }
}

/** Convenience wrapper for callers that only need the pricing/payment gate. */
export async function hasActiveAgentSubscription(): Promise<boolean> {
  const { hasActiveSubscription } = await getAgentSession();
  return hasActiveSubscription;
}
