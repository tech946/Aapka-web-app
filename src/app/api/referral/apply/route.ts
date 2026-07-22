import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  REFERRAL_COOKIE_NAME,
  REFERRAL_COOKIE_MAX_AGE,
} from '@/lib/influencer-referral';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * GET - Apply referral code, set cookie, and redirect.
 * Used by /ref/[code] - cookies can only be modified in Route Handlers.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const { data: link } = await supabaseAdmin
    .from('influencer_referral_links')
    .select('id, entity_type, entity_id, clicks')
    .eq('referral_code', code)
    .single();

  if (!link) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Increment clicks
  await supabaseAdmin
    .from('influencer_referral_links')
    .update({ clicks: (link.clicks || 0) + 1 })
    .eq('id', link.id);

  // Track click for analytics
  await supabaseAdmin.from('referral_clicks').insert({
    referral_code: code,
  });

  // Set cookie (allowed in Route Handler)
  const cookieStore = await cookies();
  cookieStore.set(REFERRAL_COOKIE_NAME, code, {
    path: '/',
    maxAge: REFERRAL_COOKIE_MAX_AGE,
    httpOnly: false,
    sameSite: 'lax',
  });

  let redirectUrl = '/';
  if (link.entity_type === 'package' && link.entity_id) {
    const { data: pkg } = await supabaseAdmin
      .from('packages')
      .select('package_id, package_categories(name)')
      .eq('package_id', link.entity_id)
      .single();

    if (pkg) {
      const catName = (pkg as { package_categories?: { name: string } })
        ?.package_categories?.name || 'packages';
      const categorySlug = toSlug(catName);
      redirectUrl = `/category/${categorySlug}/${link.entity_id}`;
    }
  }

  return NextResponse.redirect(new URL(redirectUrl, req.url));
}
