import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getInfluencerId() {
  const supabase = createServerSupabaseClient();
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
 * GET - Dashboard stats for influencer
 */
export async function GET() {
  const influencerId = await getInfluencerId();
  if (!influencerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [walletRes, conversionsRes, linksRes, clicksRes] = await Promise.all([
      supabaseAdmin
        .from('influencer_wallet')
        .select('total_earned, total_withdrawn')
        .eq('influencer_id', influencerId)
        .single(),
      supabaseAdmin
        .from('referral_conversions')
        .select('id, commission_amount, status, created_at')
        .eq('influencer_id', influencerId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabaseAdmin
        .from('influencer_referral_links')
        .select('clicks')
        .eq('influencer_id', influencerId),
      supabaseAdmin
        .from('referral_clicks')
        .select('id', { count: 'exact', head: true })
        .eq('referral_code', 'dummy'), // We'll get total from links
    ]);

    const wallet = walletRes.data;
    const totalEarned = parseFloat(wallet?.total_earned ?? 0);
    const totalWithdrawn = parseFloat(wallet?.total_withdrawn ?? 0);
    const availableBalance = Math.max(0, totalEarned - totalWithdrawn);

    const totalClicks = (linksRes.data || []).reduce((s: number, l: any) => s + (l.clicks || 0), 0);
    const totalConversions = (conversionsRes.data || []).length;

    const recentActivity = (conversionsRes.data || []).map((c: any) => ({
      id: c.id,
      amount: parseFloat(c.commission_amount || 0),
      status: c.status,
      created_at: c.created_at,
    }));

    return NextResponse.json({
      data: {
        total_earned: totalEarned,
        total_withdrawn: totalWithdrawn,
        available_balance: availableBalance,
        total_clicks: totalClicks,
        total_conversions: totalConversions,
        recent_activity: recentActivity,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Failed to fetch dashboard' },
      { status: 500 }
    );
  }
}
