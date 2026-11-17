import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Logout influencer (redirects to login)
 */
export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  const origin = req.nextUrl?.origin || 'http://localhost:3000';
  return NextResponse.redirect(new URL('/influencer/login', origin));
}
