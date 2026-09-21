import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/contact/crm-users
 *
 * CRM agents a contact query can be assigned to, for the "Push lead to CRM"
 * dialog. Proxies CRM /api/website/assignable-users with the website API key
 * so the key never reaches the browser. Dashboard session required.
 */

const CRM_USERS_URL =
  `${process.env.CRM_API_URL?.replace(/\/$/, '') || 'https://crm.aapkatourism.com'}/api/website/assignable-users`;

export interface CrmAssignableUser {
  id: string;
  full_name: string;
  email_address: string | null;
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = process.env.WEBSITE_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'WEBSITE_API_KEY is not configured on the website server' },
        { status: 500 }
      );
    }

    let res: Response;
    try {
      res = await fetch(CRM_USERS_URL, { headers: { 'x-api-key': apiKey }, cache: 'no-store' });
    } catch (err: unknown) {
      return NextResponse.json(
        { error: 'Could not reach the CRM', details: err instanceof Error ? err.message : 'Network error' },
        { status: 502 }
      );
    }

    const text = await res.text();
    let body: { users?: CrmAssignableUser[]; error?: string } = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      return NextResponse.json({ error: 'CRM returned an invalid response' }, { status: 502 });
    }
    if (!res.ok) {
      return NextResponse.json(
        { error: body.error || `CRM returned ${res.status}` },
        { status: res.status }
      );
    }

    return NextResponse.json({ users: body.users ?? [] });
  } catch (error: unknown) {
    console.error('[contact/crm-users]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}
