import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { cookies } from 'next/headers';

const REFERRAL_COOKIE_NAME = 'influencer_ref';
const REFERRAL_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

function toSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default async function RefRedirectPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!code) redirect('/');

  const { data: link } = await supabaseAdmin
    .from('influencer_referral_links')
    .select('id, entity_type, entity_id, clicks')
    .eq('referral_code', code)
    .single();

  if (!link) redirect('/');

  // Increment clicks
  await supabaseAdmin
    .from('influencer_referral_links')
    .update({ clicks: (link.clicks || 0) + 1 })
    .eq('id', link.id);

  // Track click for analytics
  await supabaseAdmin.from('referral_clicks').insert({
    referral_code: code,
  });

  const cookieStore = cookies();
  cookieStore.set(REFERRAL_COOKIE_NAME, code, {
    path: '/',
    maxAge: REFERRAL_COOKIE_MAX_AGE,
    httpOnly: false,
    sameSite: 'lax',
  });

  if (link.entity_type === 'package' && link.entity_id) {
    const { data: pkg } = await supabaseAdmin
      .from('packages')
      .select('package_id, package_categories(name)')
      .eq('package_id', link.entity_id)
      .single();

    if (pkg) {
      const catName = (pkg as any).package_categories?.name || 'packages';
      const categorySlug = toSlug(catName);
      redirect(`/category/${categorySlug}/${link.entity_id}`);
    }
  }

  redirect('/');
}
