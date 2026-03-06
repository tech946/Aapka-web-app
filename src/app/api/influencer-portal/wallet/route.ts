import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIN_WITHDRAWAL = 500;

async function getInfluencerId() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data } = await supabaseAdmin
    .from('influencers')
    .select('id')
    .eq('auth_user_id', session.user.id)
    .eq('status', 'active')
    .single();

  return data?.id ?? null;
}

/**
 * GET - Wallet balance + withdrawal history
 */
export async function GET() {
  const influencerId = await getInfluencerId();
  if (!influencerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [walletRes, withdrawalsRes] = await Promise.all([
      supabaseAdmin
        .from('influencer_wallet')
        .select('total_earned, total_withdrawn')
        .eq('influencer_id', influencerId)
        .single(),
      supabaseAdmin
        .from('influencer_withdrawals')
        .select('id, amount, status, payment_method, requested_at, processed_at')
        .eq('influencer_id', influencerId)
        .order('requested_at', { ascending: false })
        .limit(50),
    ]);

    const wallet = walletRes.data;
    const totalEarned = parseFloat(wallet?.total_earned ?? 0);
    const totalWithdrawn = parseFloat(wallet?.total_withdrawn ?? 0);
    const availableBalance = Math.max(0, totalEarned - totalWithdrawn);

    return NextResponse.json({
      data: {
        total_earned: totalEarned,
        total_withdrawn: totalWithdrawn,
        available_balance: availableBalance,
        min_withdrawal: MIN_WITHDRAWAL,
        withdrawals: withdrawalsRes.data || [],
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Failed to fetch wallet' },
      { status: 500 }
    );
  }
}

/**
 * POST - Request withdrawal
 */
export async function POST(req: NextRequest) {
  const influencerId = await getInfluencerId();
  if (!influencerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const amount = parseFloat(body?.amount || '0');
    const paymentMethod = body?.payment_method || 'upi';
    const upiId = body?.upi_id?.trim() || '';
    const bankAccountName = body?.bank_account_name?.trim() || '';
    const bankAccountNumber = body?.bank_account_number?.trim() || '';
    const ifscCode = body?.ifsc_code?.trim() || '';

    if (amount < MIN_WITHDRAWAL) {
      return NextResponse.json(
        { error: `Minimum withdrawal is ₹${MIN_WITHDRAWAL}` },
        { status: 400 }
      );
    }

    const { data: wallet } = await supabaseAdmin
      .from('influencer_wallet')
      .select('total_earned, total_withdrawn')
      .eq('influencer_id', influencerId)
      .single();

    const available =
      parseFloat(wallet?.total_earned ?? 0) - parseFloat(wallet?.total_withdrawn ?? 0);

    if (amount > available) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    if (paymentMethod === 'upi') {
      if (!upiId) {
        return NextResponse.json(
          { error: 'UPI ID is required' },
          { status: 400 }
        );
      }
    } else {
      if (!bankAccountName || !bankAccountNumber || !ifscCode) {
        return NextResponse.json(
          { error: 'Bank account details are required' },
          { status: 400 }
        );
      }
    }

    const { data: withdrawal, error } = await supabaseAdmin
      .from('influencer_withdrawals')
      .insert({
        influencer_id: influencerId,
        amount,
        status: 'pending',
        payment_method: paymentMethod,
        upi_id: paymentMethod === 'upi' ? upiId : null,
        bank_account_name: paymentMethod === 'bank_transfer' ? bankAccountName : null,
        bank_account_number: paymentMethod === 'bank_transfer' ? bankAccountNumber : null,
        ifsc_code: paymentMethod === 'bank_transfer' ? ifscCode : null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ data: withdrawal });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Failed to request withdrawal' },
      { status: 500 }
    );
  }
}
