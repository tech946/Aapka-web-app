import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { hasRoleId } from '@/lib/roles';
import { RoleId } from '@/types/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireSuperAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    return { error: 'Unauthorized', status: 401 };
  }
  const isSuperAdmin = await hasRoleId(session.user.id, RoleId.SUPER_ADMIN);
  if (!isSuperAdmin) {
    return { error: 'Forbidden', status: 403 };
  }
  return null;
}

/**
 * GET - List all influencers with stats
 */
export async function GET(req: NextRequest) {
  const authError = await requireSuperAdmin();
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  try {
    const { data: influencers, error } = await supabaseAdmin
      .from('influencers')
      .select('id, name, email, phone, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const withStats = await Promise.all(
      (influencers || []).map(async (inf: any) => {
        const [walletRes, conversionsRes] = await Promise.all([
          supabaseAdmin
            .from('influencer_wallet')
            .select('total_earned, total_withdrawn')
            .eq('influencer_id', inf.id)
            .single(),
          supabaseAdmin
            .from('referral_conversions')
            .select('commission_amount, status')
            .eq('influencer_id', inf.id),
        ]);

        const wallet = walletRes.data;
        const totalEarned = parseFloat(wallet?.total_earned ?? 0);
        const totalWithdrawn = parseFloat(wallet?.total_withdrawn ?? 0);
        const availableBalance = totalEarned - totalWithdrawn;
        const pendingAmount =
          (conversionsRes.data || [])
            .filter((c: any) => c.status === 'pending')
            .reduce((s: number, c: any) => s + parseFloat(c.commission_amount || 0), 0) || 0;

        return {
          ...inf,
          total_earned: totalEarned,
          total_withdrawn: totalWithdrawn,
          available_balance: Math.max(0, availableBalance),
          pending_amount: pendingAmount,
        };
      })
    );

    return NextResponse.json({ data: withStats });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Failed to fetch influencers' },
      { status: 500 }
    );
  }
}
