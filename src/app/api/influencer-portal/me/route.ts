import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Get current influencer profile (requires influencer auth)
 */
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: influencer, error } = await supabaseAdmin
      .from('influencers')
      .select('id, name, email, phone, status, bank_account_name, bank_account_number, ifsc_code, upi_id')
      .eq('auth_user_id', session.user.id)
      .single();

    if (error || !influencer) {
      return NextResponse.json({ error: 'Influencer not found' }, { status: 404 });
    }

    if (influencer.status !== 'active') {
      return NextResponse.json({ error: 'Account suspended' }, { status: 403 });
    }

    return NextResponse.json({ data: influencer });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
