import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CRM_BASE_URL = process.env.CRM_API_URL || 'https://crm.aapkatourism.com';

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min - reduce CRM hits
const STALE_GRACE_MS = 30 * 60 * 1000; // 30 min - serve stale on 429 if within this

const crmPackageCache = new Map<
  string,
  { data: unknown; timestamp: number }
>();

/**
 * GET - Fetch single package details from CRM (with server-side cache to reduce 429s)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const apiKey = process.env.WEBSITE_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const cached = crmPackageCache.get(id);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached.data, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
          'X-Cache': 'HIT',
        },
      });
    }

    const base = CRM_BASE_URL.replace(/\/$/, '');
    const fullUrl = `${base}/api/website/packages/${id}`;

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('CRM package [id] API error:', { status: response.status, id, error: errorText });

      if (response.status === 429 && cached && now - cached.timestamp < STALE_GRACE_MS) {
        return NextResponse.json(cached.data, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
            'X-Cache': 'STALE',
          },
        });
      }

      return NextResponse.json(
        { error: 'Failed to fetch package from CRM' },
        { status: response.status }
      );
    }

    const data = await response.json();
    crmPackageCache.set(id, { data, timestamp: now });
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching CRM package:', error);
    return NextResponse.json(
      { error: 'Failed to fetch package' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    },
  });
}
