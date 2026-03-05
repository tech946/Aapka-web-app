import { NextRequest, NextResponse } from 'next/server';
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
 * GET - Get profile
 */
export async function GET() {
  const influencerId = await getInfluencerId();
  if (!influencerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('influencers')
    .select('id, name, email, phone, bank_account_name, bank_account_number, ifsc_code, upi_id')
    .eq('id', influencerId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json({ data });
}

/**
 * PATCH - Update profile (name, phone, bank/UPI)
 */
export async function PATCH(req: NextRequest) {
  const influencerId = await getInfluencerId();
  if (!influencerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.name !== undefined) updates.name = body.name?.trim() || null;
  if (body.phone !== undefined) updates.phone = body.phone?.trim() || null;
  if (body.bank_account_name !== undefined) updates.bank_account_name = body.bank_account_name?.trim() || null;
  if (body.bank_account_number !== undefined) updates.bank_account_number = body.bank_account_number?.trim() || null;
  if (body.ifsc_code !== undefined) updates.ifsc_code = body.ifsc_code?.trim() || null;
  if (body.upi_id !== undefined) updates.upi_id = body.upi_id?.trim() || null;

  const { data, error } = await supabaseAdmin
    .from('influencers')
    .update(updates)
    .eq('id', influencerId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data });
}
