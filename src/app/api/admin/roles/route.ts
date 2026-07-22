import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getWebAppRoles, hasRoleId } from '@/lib/roles';
import { RoleId } from '@/types/roles';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSuperAdmin = await hasRoleId(session.user.id, RoleId.SUPER_ADMIN);
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Only Super Admin can fetch roles' }, { status: 403 });
    }

    const roles = await getWebAppRoles();
    return NextResponse.json({ roles });
  } catch (error: unknown) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}
