import { NextRequest, NextResponse } from 'next/server';
import { getAgentSession } from '@/lib/agent-session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Check if the current user is an active agent
 * Returns agent status and subscription details
 */
export async function GET(req: NextRequest) {
  try {
    const agentSession = await getAgentSession();

    return NextResponse.json({
      isAgent: agentSession.isAgent,
      hasActiveSubscription: agentSession.hasActiveSubscription,
      agentId: agentSession.agentId,
      subscriptionId: agentSession.subscriptionId,
    });
  } catch (error: any) {
    console.error('Error checking agent status:', error);
    return NextResponse.json(
      { isAgent: false, hasActiveSubscription: false, error: error?.message },
      { status: 500 }
    );
  }
}
