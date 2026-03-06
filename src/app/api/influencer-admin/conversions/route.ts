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
 * GET - List all conversions with optional status filter
 */
export async function GET(req: NextRequest) {
  const authError = await requireSuperAdmin();
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const status = req.nextUrl.searchParams.get('status') || '';

  try {
    let query = supabaseAdmin
      .from('referral_conversions')
      .select(`
        id, referral_code, influencer_id, booking_id, payment_amount,
        commission_percent, commission_amount, status, created_at,
        influencers(name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    if (status && ['pending', 'approved', 'rejected', 'paid'].includes(status)) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Failed to fetch conversions' },
      { status: 500 }
    );
  }
}
