import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { hasRoleId } from '@/lib/roles';
import { RoleId } from '@/types/roles';
import { randomBytes } from 'crypto';
import { sendEmail, isEmailConfigured } from '@/lib/nodemailer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireSuperAdmin(): Promise<
  { error: string; status: number } | { session: { user: { id: string } } }
> {
  const supabase = await createServerSupabaseClient();
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
  return { session };
}

/**
 * GET - List invitations
 */
export async function GET(req: NextRequest) {
  const authResult = await requireSuperAdmin();
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('influencer_invitations')
      .select('id, email, status, expires_at, used_at, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

/**
 * POST - Send invitation
 */
export async function POST(req: NextRequest) {
  const authResult = await requireSuperAdmin();
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  try {
    const body = await req.json();
    const email = (body?.email || '').trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const session = authResult.session!;
    const invitedBy = session.user.id;

    const { data: existingInfluencer } = await supabaseAdmin
      .from('influencers')
      .select('id')
      .eq('email', email)
      .single();

    if (existingInfluencer) {
      return NextResponse.json(
        { error: 'An influencer with this email already exists' },
        { status: 400 }
      );
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: invitation, error: invError } = await supabaseAdmin
      .from('influencer_invitations')
      .insert({
        email,
        token,
        invited_by: invitedBy,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (invError) {
      return NextResponse.json({ error: invError.message }, { status: 400 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
      req.nextUrl?.origin ||
      'http://localhost:3000';
    const registerUrl = `${baseUrl.replace(/\/$/, '')}/influencer/register?token=${token}`;

    if (isEmailConfigured()) {
      const emailResult = await sendEmail({
        to: email,
        subject: "You're invited to join Aapka Tourism Influencer Program",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>You're invited!</h2>
            <p>You have been invited to join the Aapka Tourism Influencer Program. Earn commissions by referring customers to our travel packages.</p>
            <p><strong>Click the link below to register (valid for 7 days):</strong></p>
            <p><a href="${registerUrl}" style="display: inline-block; padding: 12px 24px; background: #f97316; color: white; text-decoration: none; border-radius: 8px;">Accept Invitation</a></p>
            <p>Or copy this link: ${registerUrl}</p>
            <p>If you did not expect this invitation, you can ignore this email.</p>
            <p>Best regards,<br>Aapka Tourism</p>
          </div>
        `,
      });

      if (!emailResult.success) {
        console.error('[INFLUENCER INVITE] Email send failed:', emailResult.error);
        return NextResponse.json(
          { error: 'Invitation created but email could not be sent. You can share the link manually.', registerUrl },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      data: invitation,
      registerUrl: isEmailConfigured() ? undefined : registerUrl,
      message: isEmailConfigured()
        ? 'Invitation sent successfully'
        : 'Invitation created. Email not configured - share this link manually: ' + registerUrl,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? 'Failed to send invitation' },
      { status: 500 }
    );
  }
}
