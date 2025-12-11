import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - Fetch area category dropdowns from external API
export async function GET(req: NextRequest) {
  try {
    // Get API key from environment
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

    // Get CRM API base URL from environment
    // The external API base URL should be set in CRM_API_URL
    // Format: https://your-domain.com (without trailing slash)
    const crmBaseUrl = 'https://crm.aapkatourism.com';

    if (!crmBaseUrl) {
      return NextResponse.json(
        {
          error: 'CRM API URL not configured',
          message: 'Please ensure CRM_API_URL is set in your .env.local file',
        },
        { status: 500 }
      );
    }

    // Construct the full URL
    const fullUrl = `${crmBaseUrl.replace(/\/$/, '')}/api/website/area-category-dropdowns`;

    // Debug logging
    console.log('Fetching from CRM API:', fullUrl);
    console.log('CRM Base URL:', crmBaseUrl);

    // Fetch from external API
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
      console.error('External API error:', {
        status: response.status,
        statusText: response.statusText,
        url: fullUrl,
        error: errorText.substring(0, 500), // Limit error text length
      });
      return NextResponse.json(
        {
          error: 'Failed to fetch area category dropdowns',
          message: `External API returned ${response.status}: ${response.statusText}. URL: ${fullUrl}`,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Filter to return only attractions category master
    let attractionsData = [];

    // Check for area_categories at root level (actual API response structure)
    if (data.area_categories && Array.isArray(data.area_categories)) {
      // The area_categories from this endpoint are attractions
      attractionsData = data.area_categories;
    }
    // Check nested in data
    else if (data.data) {
      // Check for area_categories in data
      if (
        data.data.area_categories &&
        Array.isArray(data.data.area_categories)
      ) {
        attractionsData = data.data.area_categories;
      }
      // Check for attractions_category_master
      else if (data.data.attractions_category_master) {
        attractionsData = Array.isArray(data.data.attractions_category_master)
          ? data.data.attractions_category_master
          : [];
      }
      // Check for category_masters array and find attractions
      else if (
        data.data.category_masters &&
        Array.isArray(data.data.category_masters)
      ) {
        const attractionsCategory = data.data.category_masters.find(
          (cat: any) =>
            cat.type === 'attractions' ||
            cat.name === 'attractions' ||
            cat.category_type === 'attractions' ||
            cat.category_name?.toLowerCase() === 'attractions'
        );
        if (attractionsCategory) {
          attractionsData = Array.isArray(attractionsCategory.items)
            ? attractionsCategory.items
            : Array.isArray(attractionsCategory.data)
              ? attractionsCategory.data
              : [];
        }
      }
      // Check for direct attractions property
      else if (data.data.attractions) {
        attractionsData = Array.isArray(data.data.attractions)
          ? data.data.attractions
          : [];
      }
    }

    // Return only attractions category master
    return NextResponse.json(
      { data: attractionsData },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching area category dropdowns:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error?.message || 'Failed to fetch area category dropdowns',
      },
      { status: 500 }
    );
  }
}

// Handle CORS preflight
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    },
  });
}
