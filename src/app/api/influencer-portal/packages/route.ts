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
 * GET - List packages with commission % and influencer's referral links
 */
export async function GET() {
  const influencerId = await getInfluencerId();
  if (!influencerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [packagesRes, commissionsRes, linksRes] = await Promise.all([
      supabaseAdmin
        .from('packages')
        .select('package_id, package_name, thumbnail_image, status')
        .order('package_name'),
      supabaseAdmin
        .from('referral_commissions')
        .select('entity_id, commission_percent, is_active')
        .eq('entity_type', 'package'),
      supabaseAdmin
        .from('influencer_referral_links')
        .select('entity_id, referral_code, clicks')
        .eq('influencer_id', influencerId)
        .eq('entity_type', 'package'),
    ]);

    const normalizeId = (id: unknown) => String(id ?? '').toLowerCase().trim();
    const commissionsMap = new Map<string, { percent: number; is_active: boolean }>();
    (commissionsRes.data || []).forEach((c: any) => {
      if (c.is_active !== false) {
        const percent = Number(c.commission_percent);
        const pct = !Number.isNaN(percent) ? percent : 0;
        if (pct > 0) {
          commissionsMap.set(normalizeId(c.entity_id), {
            percent: pct,
            is_active: c.is_active !== false,
          });
        }
      }
    });

    const linksMap = new Map<string, { code: string; clicks: number }>();
    (linksRes.data || []).forEach((l: any) => {
      linksMap.set(normalizeId(l.entity_id), {
        code: l.referral_code,
        clicks: l.clicks || 0,
      });
    });

    const packages = (packagesRes.data || []).map((p: any) => {
      const pkgId = normalizeId(p.package_id);
      const comm = commissionsMap.get(pkgId);
      const link = linksMap.get(pkgId);
      return {
        package_id: p.package_id,
        package_name: p.package_name,
        thumbnail_image: p.thumbnail_image,
        commission_percent: comm?.percent ?? 0,
        has_commission: !!(comm?.is_active && comm.percent > 0),
        referral_code: link?.code ?? null,
        clicks: link?.clicks ?? 0,
      };
    });

    return NextResponse.json({
      data: packages.filter((p: any) => p.has_commission),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}
