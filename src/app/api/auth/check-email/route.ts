import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getUserRoles } from '@/lib/roles';

export const dynamic = 'force-dynamic';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Step one of the dashboard login (same flow as the CRM): is this email a
 * dashboard user? The login page only asks for the password once this says
 * yes. Profiles also hold website customers and agents, so "exists" alone is
 * not enough — the account needs an active dashboard role.
 *
 * Older profiles keep the address in `email`, newer ones in `email_address`,
 * so both are checked.
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const normalized = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!EMAIL_RE.test(normalized)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    // ilike so a mixed-case stored address still matches; escape its wildcards.
    const pattern = normalized.replace(/[\\%_]/g, (c) => `\\${c}`);

    const [byEmailAddress, byEmail] = await Promise.all([
      supabaseAdmin.from('profiles').select('id').ilike('email_address', pattern).limit(5),
      supabaseAdmin.from('profiles').select('id').ilike('email', pattern).limit(5),
    ]);

    if (byEmailAddress.error && byEmail.error) {
      console.error('check-email lookup failed:', byEmailAddress.error, byEmail.error);
      return NextResponse.json({ error: 'Could not verify email. Please try again.' }, { status: 500 });
    }

    const ids = [
      ...new Set([...(byEmailAddress.data ?? []), ...(byEmail.data ?? [])].map((row) => row.id as string)),
    ];

    if (ids.length === 0) {
      return NextResponse.json({ exists: false });
    }

    for (const id of ids) {
      const roles = await getUserRoles(id);
      if (roles.length > 0) {
        return NextResponse.json({ exists: true, access: true });
      }
    }

    return NextResponse.json({ exists: true, access: false });
  } catch (error) {
    console.error('check-email error:', error);
    return NextResponse.json({ error: 'Could not verify email. Please try again.' }, { status: 500 });
  }
}
