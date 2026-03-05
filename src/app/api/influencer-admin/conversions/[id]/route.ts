import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { hasRoleId } from '@/lib/roles';
import { RoleId } from '@/types/roles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireSuperAdmin() {
  const supabase = createServerSupabaseClient();
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
 * PATCH - Approve or reject conversion (updates wallet when approved)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireSuperAdmin();
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const adminId = session?.user?.id;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Conversion ID required' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const action = body?.action;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be approve or reject' },
        { status: 400 }
      );
    }

    const { data: conversion, error: convError } = await supabaseAdmin
      .from('referral_conversions')
      .select('id, influencer_id, commission_amount, status')
      .eq('id', id)
      .single();

    if (convError || !conversion) {
      return NextResponse.json({ error: 'Conversion not found' }, { status: 404 });
    }

    if (conversion.status !== 'pending') {
      return NextResponse.json(
        { error: 'Conversion already processed' },
        { status: 400 }
      );
    }

    if (action === 'reject') {
      await supabaseAdmin
        .from('referral_conversions')
        .update({
          status: 'rejected',
          approved_by: adminId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id);

      return NextResponse.json({ data: { status: 'rejected' } });
    }

    if (action === 'approve') {
      const amount = parseFloat(conversion.commission_amount || '0');

      await supabaseAdmin.from('referral_conversions').update({
        status: 'approved',
        approved_by: adminId,
        approved_at: new Date().toISOString(),
      }).eq('id', id);

      const { data: wallet } = await supabaseAdmin
        .from('influencer_wallet')
        .select('total_earned, total_withdrawn')
        .eq('influencer_id', conversion.influencer_id)
        .single();

      const newTotalEarned =
        parseFloat(wallet?.total_earned ?? '0') + amount;

      await supabaseAdmin
        .from('influencer_wallet')
        .update({
          total_earned: newTotalEarned,
          updated_at: new Date().toISOString(),
        })
        .eq('influencer_id', conversion.influencer_id);

      return NextResponse.json({ data: { status: 'approved' } });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Failed to update conversion' },
      { status: 500 }
    );
  }
}
