import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Check if the current user is an active agent
 * Returns agent status and subscription details
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { isAgent: false, hasActiveSubscription: false },
        { status: 200 }
      );
    }

    const userId = session.user.id;

    // Check if user has an active agent subscription
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select('id, is_active, subscription_id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (agentError || !agent || !agent.subscription_id) {
      return NextResponse.json(
        { isAgent: false, hasActiveSubscription: false },
        { status: 200 }
      );
    }

    // Check if subscription is active and not expired
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, payment_status, is_active, end_date')
      .eq('id', agent.subscription_id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { isAgent: false, hasActiveSubscription: false },
        { status: 200 }
      );
    }

    const isActive = 
      subscription.payment_status === 'completed' &&
      subscription.is_active === true &&
      new Date(subscription.end_date) > new Date();

    return NextResponse.json({
      isAgent: true,
      hasActiveSubscription: isActive,
      agentId: agent.id,
      subscriptionId: subscription.id,
    });
  } catch (error: any) {
    console.error('Error checking agent status:', error);
    return NextResponse.json(
      { isAgent: false, hasActiveSubscription: false, error: error?.message },
      { status: 500 }
    );
  }
}
