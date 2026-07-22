import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Fetch agent data
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Fetch subscription data
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('id', agent.subscription_id)
      .single();

    if (subscriptionError) {
      console.error('Error fetching subscription:', subscriptionError);
      // Return agent data even if subscription fetch fails
      return NextResponse.json({
        agent,
        subscription: null,
      });
    }

    return NextResponse.json({
      agent,
      subscription,
    });
  } catch (error: any) {
    console.error('Error loading agent dashboard:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}
