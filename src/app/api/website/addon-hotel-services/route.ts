import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CRM_BASE_URL = 'https://crm.aapkatourism.com';

const CACHE_TTL_MS = 15 * 60 * 1000;
const STALE_GRACE_MS = 60 * 60 * 1000;

const addonServicesCache = new Map<string, { data: unknown; timestamp: number }>();

/**
 * GET - Fetch addon hotel services from CRM API (with server-side cache)
 */
export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.WEBSITE_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const cacheKey = queryString || 'default';

    const cached = addonServicesCache.get(cacheKey);
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

    const fullUrl = `${CRM_BASE_URL}/api/website/addon-hotel-services${queryString ? `?${queryString}` : ''}`;

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
      console.error('CRM addon-hotel-services API error:', { status: response.status, error: errorText });

      if (response.status === 429) {
        const staleEntry =
          cached && now - cached.timestamp < STALE_GRACE_MS
            ? cached
            : Array.from(addonServicesCache.entries())
                .map(([, v]) => v)
                .filter((v) => now - v.timestamp < STALE_GRACE_MS)
                .sort((a, b) => b.timestamp - a.timestamp)[0];
        if (staleEntry) {
          return NextResponse.json(staleEntry.data, {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
              'X-Cache': 'STALE',
            },
          });
        }
      }

      return NextResponse.json(
        { error: 'Failed to fetch addon hotel services' },
        { status: response.status }
      );
    }

    const data = await response.json();
    addonServicesCache.set(cacheKey, { data, timestamp: now });
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching addon hotel services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addon hotel services' },
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
