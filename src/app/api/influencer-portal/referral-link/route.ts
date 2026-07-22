import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function generateReferralCode(influencerName: string, packageId: string): string {
  const prefix = (influencerName || 'INF')
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 4)
    .toUpperCase();
  const pkgShort = packageId.replace(/-/g, '').slice(0, 6).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-PKG-${pkgShort}-${random}`;
}

async function getInfluencer() {
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data } = await supabaseAdmin
    .from('influencers')
    .select('id, name')
    .eq('auth_user_id', session.user.id)
    .eq('status', 'active')
    .single();

  return data;
}

/**
 * POST - Generate or get referral link for a package
 */
export async function POST(req: NextRequest) {
  const influencer = await getInfluencer();
  if (!influencer) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const packageId = body?.package_id;

    if (!packageId) {
      return NextResponse.json(
        { error: 'package_id is required' },
        { status: 400 }
      );
    }

    const { data: existing } = await supabaseAdmin
      .from('influencer_referral_links')
      .select('id, referral_code')
      .eq('influencer_id', influencer.id)
      .eq('entity_type', 'package')
      .eq('entity_id', packageId)
      .single();

    if (existing) {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        req.nextUrl?.origin ||
        'http://localhost:3000';
      const refUrl = `${baseUrl.replace(/\/$/, '')}/ref/${existing.referral_code}`;
      return NextResponse.json({
        data: {
          referral_code: existing.referral_code,
          referral_url: refUrl,
        },
      });
    }

    let code = generateReferralCode(influencer.name || '', packageId);
    let attempts = 0;
    while (attempts < 5) {
      const { data: clash } = await supabaseAdmin
        .from('influencer_referral_links')
        .select('id')
        .eq('referral_code', code)
        .maybeSingle();

      if (!clash) break;
      code = generateReferralCode(influencer.name || '', packageId);
      attempts++;
    }

    const { data: link, error } = await supabaseAdmin
      .from('influencer_referral_links')
      .insert({
        influencer_id: influencer.id,
        entity_type: 'package',
        entity_id: packageId,
        referral_code: code,
        clicks: 0,
      })
      .select('referral_code')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      req.nextUrl?.origin ||
      'http://localhost:3000';
    const refUrl = `${baseUrl.replace(/\/$/, '')}/ref/${link.referral_code}`;

    return NextResponse.json({
      data: {
        referral_code: link.referral_code,
        referral_url: refUrl,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Failed to generate link' },
      { status: 500 }
    );
  }
}
