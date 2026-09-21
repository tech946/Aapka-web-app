import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { buildCrmWebsiteLeadPayload } from '@/lib/website-lead-payload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/contact/[id]/push-to-crm
 *
 * Turns a Contact Us query into a CRM lead through the very same pipe the
 * travel-enquiry form uses (CRM /api/website/leads with WEBSITE_API_KEY), so
 * the lead is created — or merged into an existing lead with the same
 * WhatsApp number — exactly like a website enquiry. Differences from the
 * enquiry form are only in the data: lead_source is `website-contact` and the
 * customer's message lands in `enquiry_message`.
 *
 * On success the query is stamped with the CRM reference so it cannot be
 * pushed twice, and moves from `new` to `contacted`.
 */

const CRM_LEADS_URL =
  `${process.env.CRM_API_URL?.replace(/\/$/, '') || 'https://crm.aapkatourism.com'}/api/website/leads`;

const CONTACT_LEAD_SOURCE = 'website-contact';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ContactQueryRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  message: string | null;
  status: string | null;
  crm_lead_reference?: string | null;
  pushed_to_crm_at?: string | null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Dashboard users only — same session check as the other admin APIs.
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!UUID_RE.test(id)) {
      return NextResponse.json({ error: 'Invalid query id' }, { status: 400 });
    }

    // The admin must pick who gets the lead; the CRM re-checks the id.
    const body = (await req.json().catch(() => ({}))) as { assigneeId?: unknown };
    const assigneeId = typeof body.assigneeId === 'string' ? body.assigneeId.trim() : '';
    if (!UUID_RE.test(assigneeId)) {
      return NextResponse.json({ error: 'Choose a CRM agent to assign this lead to' }, { status: 400 });
    }

    const apiKey = process.env.WEBSITE_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'WEBSITE_API_KEY is not configured on the website server' },
        { status: 500 }
      );
    }

    const { data: query, error: loadError } = await supabaseAdmin
      .from('contact_queries')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (loadError) {
      return NextResponse.json(
        { error: 'Failed to load contact query', details: loadError.message },
        { status: 500 }
      );
    }
    const row = query as ContactQueryRow | null;
    if (!row) {
      return NextResponse.json({ error: 'Contact query not found' }, { status: 404 });
    }
    if (row.crm_lead_reference) {
      return NextResponse.json(
        {
          error: `Already pushed to CRM as ${row.crm_lead_reference}`,
          reference: row.crm_lead_reference,
        },
        { status: 409 }
      );
    }

    const fullName = [row.first_name, row.last_name]
      .map((s) => (s ?? '').trim())
      .filter(Boolean)
      .join(' ');
    const phone = (row.phone ?? '').trim();
    if (!fullName || !phone) {
      return NextResponse.json(
        { error: 'The query needs a name and a phone number to become a lead' },
        { status: 400 }
      );
    }

    // Same builder as the enquiry form, so field handling is identical.
    const crmPayload = {
      ...buildCrmWebsiteLeadPayload({
        full_name_as_per_passport: fullName,
        whatsapp_number: phone,
        email_id: row.email ?? '',
      }),
      lead_source: CONTACT_LEAD_SOURCE,
      assigned_to: assigneeId,
      ...(row.message?.trim() ? { enquiry_message: row.message.trim() } : {}),
    };

    let crmResponse: Response;
    try {
      crmResponse = await fetch(CRM_LEADS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify(crmPayload),
      });
    } catch (fetchError: unknown) {
      const message = fetchError instanceof Error ? fetchError.message : 'Network error';
      console.error('[contact push-to-crm] CRM unreachable:', fetchError);
      return NextResponse.json(
        { error: 'Could not reach the CRM', details: message },
        { status: 502 }
      );
    }

    const text = await crmResponse.text();
    let crmBody: {
      success?: boolean;
      updated?: boolean;
      reference?: string | null;
      assignment?: { assigned: boolean; assignee_id: string; assignee_name: string; kept_existing: boolean } | null;
      error?: string;
      details?: unknown;
    } = {};
    try {
      crmBody = text ? JSON.parse(text) : {};
    } catch {
      console.error('[contact push-to-crm] non-JSON CRM response:', text.slice(0, 500));
      return NextResponse.json({ error: 'CRM returned an invalid response' }, { status: 502 });
    }

    if (!crmResponse.ok) {
      console.error('[contact push-to-crm] CRM error:', crmResponse.status, text.slice(0, 500));
      return NextResponse.json(
        {
          error: crmBody.error || 'CRM rejected the lead',
          details: crmBody.details ?? `CRM returned ${crmResponse.status}`,
        },
        { status: crmResponse.status }
      );
    }

    const reference = typeof crmBody.reference === 'string' && crmBody.reference ? crmBody.reference : null;
    const updatedExisting = crmBody.updated === true;
    const assignment = crmBody.assignment ?? null;

    const stamp: Record<string, unknown> = {
      crm_lead_reference: reference,
      crm_assignee_name: assignment?.assignee_name ?? null,
      pushed_to_crm_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (row.status === 'new') stamp.status = 'contacted';

    const { data: saved, error: saveError } = await supabaseAdmin
      .from('contact_queries')
      .update(stamp)
      .eq('id', id)
      .select('*')
      .single();
    if (saveError) {
      // The lead exists in the CRM; tell the admin so it is not pushed again by hand.
      const hint = /crm_(lead_reference|assignee_name)/.test(saveError.message)
        ? 'Run database/add-crm-push-to-contact-queries.sql on Supabase.'
        : undefined;
      console.error('[contact push-to-crm] stamp failed:', saveError.message);
      return NextResponse.json(
        {
          error: `Lead ${reference ?? ''} was created in the CRM but the query could not be marked as pushed`,
          details: saveError.message,
          hint,
          reference,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: updatedExisting,
      reference,
      assignment,
      message: describeOutcome(reference, updatedExisting, assignment),
      data: saved,
    });
  } catch (error: unknown) {
    console.error('[contact push-to-crm]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unexpected error' },
      { status: 500 }
    );
  }
}

function describeOutcome(
  reference: string | null,
  updatedExisting: boolean,
  assignment: { assigned: boolean; assignee_name: string; kept_existing: boolean } | null
): string {
  const ref = reference ?? 'lead';
  if (!updatedExisting) {
    return assignment ? `Lead ${ref} created in CRM and assigned to ${assignment.assignee_name}` : `Lead ${ref} created in CRM`;
  }
  if (assignment?.kept_existing) {
    return `Merged into existing CRM lead ${ref}, already handled by ${assignment.assignee_name} (kept)`;
  }
  return assignment
    ? `Merged into existing CRM lead ${ref} (same WhatsApp) and assigned to ${assignment.assignee_name}`
    : `Merged into existing CRM lead ${ref} (same WhatsApp number)`;
}
