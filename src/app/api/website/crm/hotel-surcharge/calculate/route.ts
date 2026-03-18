import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CRM_BASE_URL = process.env.CRM_API_URL || 'https://crm.aapkatourism.com';

/**
 * GET - Proxy hotel surcharge calculation to CRM
 * Query params: hotel_id, room_type, check_in, check_out, rooms
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
    const base = CRM_BASE_URL.replace(/\/$/, '');
    const fullUrl = `${base}/api/website/hotel-surcharge/calculate?${searchParams.toString()}`;

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        data.error ? { error: data.error } : { error: 'Failed to calculate surcharge' },
        { status: response.status }
      );
    }

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
      },
    });
  } catch (error: unknown) {
    console.error('Hotel surcharge proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate surcharge' },
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
