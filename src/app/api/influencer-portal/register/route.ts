import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST - Register influencer (token-based invite)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, name, phone, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (!name || (name as string).trim().length < 2) {
      return NextResponse.json(
        { error: 'Name must be at least 2 characters' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const { data: invitation, error: invError } = await supabaseAdmin
      .from('influencer_invitations')
      .select('id, email, status, expires_at')
      .eq('token', token)
      .single();

    if (invError || !invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation link' },
        { status: 400 }
      );
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'This invitation has already been used' },
        { status: 400 }
      );
    }

    if (new Date(invitation.expires_at) < new Date()) {
      await supabaseAdmin
        .from('influencer_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      );
    }

    const email = invitation.email;

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
        data: { role: 'influencer' },
      },
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
        const user = existingUser?.users?.find(u => u.email === email);
        if (user) {
          const { data: existingInf } = await supabaseAdmin
            .from('influencers')
            .select('id')
            .eq('email', email)
            .single();
          if (existingInf) {
            return NextResponse.json(
              { error: 'An account with this email already exists. Please log in.' },
              { status: 400 }
            );
          }
        }
      }
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
    }

    const { data: newInf, error: infError } = await supabaseAdmin
      .from('influencers')
      .insert({
        auth_user_id: authData.user.id,
        name: (name || '').trim(),
        email,
        phone: (phone || '').trim() || null,
        status: 'active',
      })
      .select('id')
      .single();

    if (infError || !newInf) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: 'Failed to create influencer profile' },
        { status: 500 }
      );
    }

    await supabaseAdmin.from('influencer_wallet').insert({
      influencer_id: newInf.id,
      total_earned: 0,
      total_withdrawn: 0,
    });

    await supabaseAdmin
      .from('influencer_invitations')
      .update({
        status: 'used',
        used_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    return NextResponse.json({
      success: true,
      redirectTo: '/influencer/dashboard',
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Registration failed' },
      { status: 500 }
    );
  }
}
