import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CRM_BASE_URL = process.env.CRM_API_URL || 'https://crm.aapkatourism.com';

/**
 * GET - Fetch packages list from CRM (no fallback - CRM only)
 * Proxies to CRM /api/website/packages
 * Query params: page, limit, nights
 *
 * Requires: WEBSITE_API_KEY and CRM_API_URL (or defaults to crm.aapkatourism.com)
 */
export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.WEBSITE_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured. Set WEBSITE_API_KEY in .env.local and ensure CRM has matching key.' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const base = CRM_BASE_URL.replace(/\/$/, '');
    const fullUrl = `${base}/api/website/packages${queryString ? `?${queryString}` : ''}`;

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
      console.error('CRM packages API error:', { status: response.status, url: fullUrl, error: errorText });
      return NextResponse.json(
        {
          error: 'Failed to fetch packages from CRM',
          details: response.status === 404
            ? 'CRM packages API not found. Ensure the CRM is running and has /api/website/packages deployed.'
            : errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching CRM packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch packages' },
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
