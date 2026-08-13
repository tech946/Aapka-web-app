import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Fetch commissions and wallet balance for an agent
 * Query params: agentId (required)
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get('agentId');

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    // Verify the agent belongs to the logged-in user
    const { data: agent } = await supabaseAdmin
      .from('agents')
      .select('id, user_id')
      .eq('id', agentId)
      .eq('user_id', session.user.id)
      .single();

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found or unauthorized' },
        { status: 403 }
      );
    }

    // Fetch commissions
    const { data: commissions, error: commissionsError } = await supabaseAdmin
      .from('agent_commissions')
      .select('id, booking_id, amount, currency, commission_rate, status, created_at')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (commissionsError) {
      console.error('[COMMISSIONS] Error fetching commissions:', commissionsError);
      return NextResponse.json(
        { error: 'Failed to fetch commissions', details: commissionsError.message },
        { status: 500 }
      );
    }

    // Calculate wallet balance
    const { data: walletTransactions, error: walletError } = await supabaseAdmin
      .from('agent_wallet')
      .select('amount, balance_type')
      .eq('agent_id', agentId);

    if (walletError) {
      console.error('[WALLET] Error fetching wallet:', walletError);
      return NextResponse.json(
        { error: 'Failed to fetch wallet balance', details: walletError.message },
        { status: 500 }
      );
    }

    // Calculate balances
    let available = 0;
    let pending = 0;

    walletTransactions?.forEach(transaction => {
      if (transaction.balance_type === 'available') {
        available += parseFloat(transaction.amount.toString());
      } else if (transaction.balance_type === 'pending') {
        pending += parseFloat(transaction.amount.toString());
      }
    });

    const total = available + pending;

    return NextResponse.json({
      success: true,
      commissions: commissions || [],
      walletBalance: {
        available: Math.max(0, available),
        pending: Math.max(0, pending),
        total: Math.max(0, total),
      },
    });
  } catch (error: any) {
    console.error('[COMMISSIONS] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch commissions' },
      { status: 500 }
    );
  }
}
