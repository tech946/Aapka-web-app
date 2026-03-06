import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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
 * GET - List all referral conversions (earnings) for influencer
 */
export async function GET() {
  const influencerId = await getInfluencerId();
  if (!influencerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('referral_conversions')
      .select('id, referral_code, payment_amount, commission_percent, commission_amount, status, created_at, booking_id')
      .eq('influencer_id', influencerId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const withPackage = await Promise.all(
      (data || []).map(async (c: any) => {
        let packageName = '—';
        const booking = await supabaseAdmin
          .from('bookings')
          .select('package_ids')
          .eq('id', c.booking_id)
          .single();
        if (booking.data?.package_ids?.[0]) {
          const pkg = await supabaseAdmin
            .from('packages')
            .select('package_name')
            .eq('package_id', booking.data.package_ids[0])
            .single();
          packageName = pkg.data?.package_name || packageName;
        }
        return {
          ...c,
          package_name: packageName,
          commission_amount: parseFloat(c.commission_amount || 0),
          payment_amount: parseFloat(c.payment_amount || 0),
        };
      })
    );

    return NextResponse.json({ data: withPackage });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Failed to fetch earnings' },
      { status: 500 }
    );
  }
}
