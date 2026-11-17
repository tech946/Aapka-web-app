import 'server-only';
import { buildCrmWebsiteLeadPayload } from '@/lib/website-lead-payload';

const CRM_LEADS_URL = `${process.env.CRM_API_URL?.replace(/\/$/, '') || 'https://crm.aapkatourism.com'}/api/website/leads`;
const TIMEOUT_MS = 10000;

export type WebsiteLeadInput = {
  fullName: string;
  phone: string;
  email?: string | null;
};

export type WebsiteLeadResult =
  | { ok: true; reference: string | null; updated: boolean; assigneeName: string | null }
  | { ok: false; status: number; error: string };

export async function sendWebsiteLead(input: WebsiteLeadInput): Promise<WebsiteLeadResult> {
  const apiKey = process.env.WEBSITE_API_KEY?.trim();
  if (!apiKey) return { ok: false, status: 500, error: 'WEBSITE_API_KEY is not configured' };

  const payload = buildCrmWebsiteLeadPayload({
    full_name_as_per_passport: input.fullName,
    whatsapp_number: input.phone,
    email_id: input.email ?? '',
  });

  try {
    const res = await fetch(CRM_LEADS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const text = await res.text();
    let body: {
      error?: string;
      updated?: boolean;
      reference?: string | null;
      assignment?: { assignee_name?: string } | null;
    } = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      return { ok: false, status: 502, error: 'CRM returned an invalid response' };
    }
    if (!res.ok) return { ok: false, status: res.status, error: body.error || `CRM returned ${res.status}` };
    return {
      ok: true,
      reference: typeof body.reference === 'string' && body.reference ? body.reference : null,
      updated: body.updated === true,
      assigneeName: body.assignment?.assignee_name ?? null,
    };
  } catch (error: unknown) {
    return { ok: false, status: 502, error: error instanceof Error ? error.message : 'Could not reach the CRM' };
  }
}
