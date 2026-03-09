import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CRM_BASE_URL = process.env.CRM_API_URL || 'https://crm.aapkatourism.com';

/**
 * GET - Fetch single package details from CRM (CRM only, no fallback)
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
      return NextResponse.json(
        { error: 'Failed to fetch package from CRM' },
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
