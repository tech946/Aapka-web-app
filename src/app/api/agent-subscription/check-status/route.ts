import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if agent exists and has active subscription
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select(`
        id,
        email,
        full_name,
        is_active,
        subscription_id,
        subscriptions (
          id,
          payment_status,
          is_active,
          end_date,
          amount_paid,
          currency
        )
      `)
      .eq('email', email)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({
        hasSubscription: false,
        isActive: false,
      });
    }

    const subscription = agent.subscriptions;
    const hasActiveSubscription = 
      subscription &&
      subscription.payment_status === 'completed' &&
      subscription.is_active &&
      new Date(subscription.end_date) > new Date();

    return NextResponse.json({
      hasSubscription: !!subscription,
      isActive: hasActiveSubscription || false,
      agent: {
        id: agent.id,
        email: agent.email,
        fullName: agent.full_name,
        isActive: agent.is_active,
      },
      subscription: subscription ? {
        id: subscription.id,
        paymentStatus: subscription.payment_status,
        isActive: subscription.is_active,
        endDate: subscription.end_date,
        amountPaid: subscription.amount_paid,
        currency: subscription.currency,
      } : null,
    });
  } catch (error: any) {
    console.error('Error checking agent subscription status:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to check subscription status' },
      { status: 500 }
    );
  }
}
