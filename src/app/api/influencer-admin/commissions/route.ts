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
    return { error: 'Forbidden: Super Admin role required', status: 403 };
  }
  return null;
}

/**
 * GET - List all packages with their commission settings
 */
export async function GET(req: NextRequest) {
  const authError = await requireSuperAdmin();
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  try {
    const [packagesRes, commissionsRes] = await Promise.all([
      supabaseAdmin
        .from('packages')
        .select('package_id, package_name, status')
        .order('package_name'),
      supabaseAdmin.from('referral_commissions').select('*'),
    ]);

    if (packagesRes.error) {
      return NextResponse.json(
        { error: packagesRes.error.message },
        { status: 500 }
      );
    }

    const normalizeId = (id: unknown) => String(id ?? '').toLowerCase().trim();
    const commissionsMap = new Map<string, { id: string; commission_percent: number; is_active: boolean }>();
    (commissionsRes.data || []).forEach((c: any) => {
      const key = `${String(c.entity_type || '').toLowerCase()}:${normalizeId(c.entity_id)}`;
      commissionsMap.set(key, {
        id: c.id,
        commission_percent: Number(c.commission_percent) || 0,
        is_active: c.is_active !== false,
      });
    });

    const packages = (packagesRes.data || []).map((p: any) => {
      const key = `package:${normalizeId(p.package_id)}`;
      const comm = commissionsMap.get(key);
      return {
        package_id: p.package_id,
        package_name: p.package_name,
        status: p.status,
        commission_id: comm?.id ?? null,
        commission_percent: comm?.commission_percent ?? 0,
        is_active: comm?.is_active ?? false,
      };
    });

    return NextResponse.json({ data: packages });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Failed to fetch commissions' },
      { status: 500 }
    );
  }
}

/**
 * POST - Upsert commission for a package
 */
export async function POST(req: NextRequest) {
  const authError = await requireSuperAdmin();
  if (authError) {
    return NextResponse.json({ error: authError.error }, { status: authError.status });
  }

  try {
    const body = await req.json();
    const { entity_type, entity_id, commission_percent, is_active } = body;

    if (!entity_type || !entity_id) {
      return NextResponse.json(
        { error: 'entity_type and entity_id are required' },
        { status: 400 }
      );
    }

    const percent = Number(commission_percent);
    if (Number.isNaN(percent) || percent < 0 || percent > 100) {
      return NextResponse.json(
        { error: 'Commission must be between 0 and 100' },
        { status: 400 }
      );
    }

    const { data: existing } = await supabaseAdmin
      .from('referral_commissions')
      .select('id')
      .eq('entity_type', entity_type)
      .eq('entity_id', entity_id)
      .single();

    const payload = {
      entity_type,
      entity_id,
      commission_percent: percent,
      is_active: is_active !== false,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('referral_commissions')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ data });
    } else {
      const { data, error } = await supabaseAdmin
        .from('referral_commissions')
        .insert({
          ...payload,
          created_by: null,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ data }, { status: 201 });
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Failed to save commission' },
      { status: 500 }
    );
  }
}
