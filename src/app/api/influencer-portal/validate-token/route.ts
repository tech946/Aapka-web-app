import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Validate invitation token (for registration page)
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ valid: false });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('influencer_invitations')
      .select('id, email, status, expires_at')
      .eq('token', token)
      .single();

    if (error || !data) {
      return NextResponse.json({ valid: false });
    }

    if (data.status !== 'pending') {
      return NextResponse.json({ valid: false });
    }

    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true, email: data.email });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
