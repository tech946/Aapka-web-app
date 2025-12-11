import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Handle CORS preflight
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
    },
  });
}

// POST - Submit lead from website
export async function POST(req: NextRequest) {
  try {
    // This endpoint proxies to the CRM leads API endpoint
    // The API key (WEBSITE_API_KEY) is stored server-side in environment variables

    // Get API key from environment
    const apiKey = process.env.WEBSITE_API_KEY?.trim();

    if (!apiKey) {
      console.error('WEBSITE_API_KEY is not configured');
      console.error('Available env vars:', {
        hasApiKey: !!process.env.WEBSITE_API_KEY,
        hasCrmUrl: !!process.env.CRM_API_URL,
        nodeEnv: process.env.NODE_ENV,
      });
      return NextResponse.json(
        {
          error: 'API key not configured',
          message:
            'Please ensure WEBSITE_API_KEY is set in your .env.local file and restart your dev server.',
        },
        { status: 500 }
      );
    }

    // Use hardcoded CRM URL directly
    const crmUrl = 'https://crm.aapkatourism.com/api/website/leads';

    // Parse request body
    const body = await req.json();

    // Validate required fields
    if (!body.full_name_as_per_passport || !body.whatsapp_number) {
      return NextResponse.json(
        {
          error: 'Full name (as per passport) and WhatsApp number are required',
        },
        { status: 400 }
      );
    }

    // Transform body to match CRM API structure
    // Convert tours_and_activities to selected_attractions
    const { tours_and_activities, ...restBody } = body;

    const crmRequestBody = {
      ...restBody,
      // 6. Tours & Activities - Convert to selected_attractions
      selected_attractions:
        tours_and_activities && Array.isArray(tours_and_activities)
          ? tours_and_activities
          : null,
      // Mark as coming from website
      source: 'website',
    };

    // Proxy to external CRM endpoint
    try {
      console.log('Calling CRM endpoint:', crmUrl);
      const response = await fetch(crmUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify(crmRequestBody),
      });

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error('CRM API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText.substring(0, 500),
        });
        return NextResponse.json(
          {
            error: 'Failed to connect to CRM endpoint',
            details: `CRM returned ${response.status}: ${response.statusText}`,
          },
          { status: response.status }
        );
      }

      // Try to parse JSON response
      let responseData;
      const responseText = await response.text();
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        console.error('Failed to parse CRM response as JSON:', parseError);
        console.error('Response text:', responseText.substring(0, 500));
        return NextResponse.json(
          {
            error: 'Failed to parse CRM response',
            details: 'CRM endpoint returned invalid JSON',
          },
          { status: 500 }
        );
      }

      return NextResponse.json(responseData, {
        status: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, x-api-key, Authorization',
        },
      });
    } catch (fetchError: any) {
      console.error('Error calling CRM endpoint:', fetchError);
      return NextResponse.json(
        {
          error: 'Failed to connect to CRM endpoint',
          details: fetchError.message || 'Network error or invalid response',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in website leads API:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Unexpected error occurred',
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers':
            'Content-Type, x-api-key, Authorization',
        },
      }
    );
  }
}
