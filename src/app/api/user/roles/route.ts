import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getUserWithRoles } from '@/lib/roles';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized', user: null }, { status: 401 });
    }

    const userWithRoles = await getUserWithRoles(session.user.id);

    if (!userWithRoles) {
      return NextResponse.json({ error: 'User not found', user: null }, { status: 404 });
    }

    return NextResponse.json({
      user: userWithRoles,
      success: true,
    });
  } catch (error: unknown) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'Failed to fetch roles', user: null },
      { status: 500 }
    );
  }
}
