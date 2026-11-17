import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { getUserRoles } from '@/lib/roles';
import { DASHBOARD_HOME, canAccessPath, landingPathFor, resolvePermissions } from '@/lib/access';

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();

  const { email, password, redirectTo } = await request.json();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  if (!data.session?.user) {
    return NextResponse.json({ error: 'Login failed' }, { status: 401 });
  }

  const roles = await getUserRoles(data.session.user.id);
  const permissions = resolvePermissions(roles.map((r) => Number(r.role_id)));
  const requested = typeof redirectTo === 'string' && /^\/(?!\/)/.test(redirectTo) ? redirectTo : DASHBOARD_HOME;
  const finalRedirect =
    requested !== DASHBOARD_HOME && canAccessPath(permissions, requested) ? requested : landingPathFor(permissions);

  return NextResponse.json({ redirectTo: finalRedirect });
}
