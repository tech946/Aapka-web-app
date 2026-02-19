import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { hasRoleId } from '@/lib/roles';
import { RoleId } from '@/types/roles';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

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

  // Content Editor: redirect to blog management. Others: use redirectTo or /dashboard
  let finalRedirect = redirectTo || '/dashboard';
  const isContentEditor = await hasRoleId(data.session.user.id, RoleId.CONTENT_EDITOR);
  if (isContentEditor) {
    finalRedirect = '/dashboard/blog-management';
  }

  return NextResponse.json({ redirectTo: finalRedirect });
}
