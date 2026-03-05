import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST - Influencer login (email + password)
 * Verifies user exists in influencers table
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 401 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Login failed' }, { status: 401 });
    }

    const { data: influencer } = await supabaseAdmin
      .from('influencers')
      .select('id, status')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (!influencer) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'This is not an influencer account. Use the admin login for dashboard access.' },
        { status: 403 }
      );
    }

    if (influencer.status !== 'active') {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'Your account has been suspended. Please contact support.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      redirectTo: '/influencer/dashboard',
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Login failed' },
      { status: 500 }
    );
  }
}
