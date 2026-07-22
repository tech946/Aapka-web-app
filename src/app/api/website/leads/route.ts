import { NextRequest, NextResponse } from 'next/server';
import { buildCrmWebsiteLeadPayload } from '@/lib/website-lead-payload';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CRM_LEADS_URL =
  `${process.env.CRM_API_URL?.replace(/\/$/, '') || 'https://crm.aapkatourism.com'}/api/website/leads`;

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
  };
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  });
}

// POST - Submit lead from website (proxies to CRM; create or update by WhatsApp)
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.WEBSITE_API_KEY?.trim();

    if (!apiKey) {
      console.error('WEBSITE_API_KEY is not configured');
      return NextResponse.json(
        {
          error: 'API key not configured',
          message:
            'Please ensure WEBSITE_API_KEY is set in your .env.local file and restart your dev server.',
        },
        { status: 500 }
      );
    }

    const body = (await req.json()) as Record<string, unknown>;

    if (!body.full_name_as_per_passport || !body.whatsapp_number) {
      return NextResponse.json(
        {
          error: 'Full name (as per passport) and WhatsApp number are required',
        },
        { status: 400 }
      );
    }

    const crmRequestBody = buildCrmWebsiteLeadPayload(body);

    try {
      const response = await fetch(CRM_LEADS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(crmRequestBody),
      });

      const responseText = await response.text();
      let responseData: Record<string, unknown> = {};
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch {
        console.error('Failed to parse CRM response as JSON:', responseText.substring(0, 500));
        return NextResponse.json(
          {
            error: 'Failed to parse CRM response',
            details: 'CRM endpoint returned invalid JSON',
          },
          { status: 500 }
        );
      }

      // CRM returns 201 (new lead) or 200 (updated existing lead by WhatsApp)
      if (!response.ok) {
        console.error('CRM API error:', {
          status: response.status,
          statusText: response.statusText,
          error: responseText.substring(0, 500),
        });
        return NextResponse.json(
          {
            error:
              (typeof responseData.error === 'string' && responseData.error) ||
              'Failed to submit lead to CRM',
            details: responseData.details ?? `CRM returned ${response.status}`,
          },
          { status: response.status, headers: corsHeaders() }
        );
      }

      return NextResponse.json(responseData, {
        status: response.status,
        headers: corsHeaders(),
      });
    } catch (fetchError: unknown) {
      const message = fetchError instanceof Error ? fetchError.message : 'Network error';
      console.error('Error calling CRM endpoint:', fetchError);
      return NextResponse.json(
        {
          error: 'Failed to connect to CRM endpoint',
          details: message,
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Error in website leads API:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unexpected error occurred',
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}
