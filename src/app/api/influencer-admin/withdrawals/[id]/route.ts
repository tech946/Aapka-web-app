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
 * PATCH - Mark withdrawal as paid or rejected
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
    return NextResponse.json({ error: 'Withdrawal ID required' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const action = body?.action;
    const adminNotes = body?.admin_notes?.trim();

    if (!action || !['paid', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be paid or reject' },
        { status: 400 }
      );
    }

    const { data: withdrawal, error: wErr } = await supabaseAdmin
      .from('influencer_withdrawals')
      .select('id, influencer_id, amount, status')
      .eq('id', id)
      .single();

    if (wErr || !withdrawal) {
      return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { error: 'Withdrawal already processed' },
        { status: 400 }
      );
    }

    if (action === 'reject') {
      await supabaseAdmin
        .from('influencer_withdrawals')
        .update({
          status: 'rejected',
          processed_by: adminId,
          processed_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq('id', id);

      return NextResponse.json({ data: { status: 'rejected' } });
    }

    if (action === 'paid') {
      const amount = parseFloat(withdrawal.amount || '0');

      await supabaseAdmin
        .from('influencer_withdrawals')
        .update({
          status: 'paid',
          processed_by: adminId,
          processed_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        })
        .eq('id', id);

      const { data: wallet } = await supabaseAdmin
        .from('influencer_wallet')
        .select('total_withdrawn')
        .eq('influencer_id', withdrawal.influencer_id)
        .single();

      const newTotalWithdrawn =
        parseFloat(wallet?.total_withdrawn ?? '0') + amount;

      await supabaseAdmin
        .from('influencer_wallet')
        .update({
          total_withdrawn: newTotalWithdrawn,
          updated_at: new Date().toISOString(),
        })
        .eq('influencer_id', withdrawal.influencer_id);

      return NextResponse.json({ data: { status: 'paid' } });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Failed to update withdrawal' },
      { status: 500 }
    );
  }
}
