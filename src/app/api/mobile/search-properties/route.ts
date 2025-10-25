import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase-admin';

interface SearchFilters {
  searchkey?: string;
  areaname?: string;
  cityname?: string;
  property_status?: string;
  developers?: string[];
  hasBrochure?: boolean;
  page?: number;
  limit?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please provide a valid token.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      searchkey,
      areaname,
      cityname,
      property_status,
      developers,
      hasBrochure,
      page = 1,
      limit = 20,
    }: SearchFilters = body;

    // Validate pagination parameters
    const pageNumber = Math.max(1, page);
    const limitNumber = Math.min(Math.max(1, limit), 100); // Max 100 items per page
    const offset = (pageNumber - 1) * limitNumber;

    let query = supabaseAdmin
      .from('properties')
      .select(
        `
        id,
        project_name,
        starting_price,
        thumbnail_image,
        brochure_url,
        is_active,
        created_at,
        updated_at,
        property_types (
          id,
          name
        ),
        cities (
          id,
          name
        ),
        states (
          id,
          name
        ),
        countries (
          id,
          name,
          code
        ),
        developers (
          id,
          name
        ),
        property_statuses (
          id,
          name
        )
      `
      )
      .eq('is_active', true);

    // If no searchkey provided, return default search properties
    if (!searchkey || searchkey.trim() === '') {
      console.log(
        'No search key provided, returning default search properties'
      );

      // Get total count for pagination
      const { count: totalCount, error: countError } = await supabaseAdmin
        .from('default_search_properties')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (countError) {
        console.error('Error counting default search properties:', countError);
        return NextResponse.json(
          { error: 'Failed to count default search properties' },
          { status: 500 }
        );
      }

      // Get default search properties with pagination
      const { data: defaultSearchData, error: defaultSearchError } =
        await supabaseAdmin
          .from('default_search_properties')
          .select(
            `
          property_id,
          display_order,
          properties (
            id,
            project_name,
            starting_price,
            thumbnail_image,
            brochure_url,
            is_active,
            created_at,
            updated_at,
            property_types (
              id,
              name
            ),
            cities (
              id,
              name
            ),
            states (
              id,
              name
            ),
            countries (
              id,
              name,
              code
            ),
            developers (
              id,
              name
            ),
            property_statuses (
              id,
              name
            )
          )
        `
          )
          .eq('is_active', true)
          .order('display_order', { ascending: true })
          .range(offset, offset + limitNumber - 1);

      if (defaultSearchError) {
        console.error(
          'Error fetching default search properties:',
          defaultSearchError
        );
        return NextResponse.json(
          { error: 'Failed to fetch default search properties' },
          { status: 500 }
        );
      }

      // Transform the data to match the expected format
      const transformedData =
        defaultSearchData?.map(item => ({
          ...item.properties,
        })) || [];

      const totalPages = Math.ceil((totalCount || 0) / limitNumber);
      const hasNextPage = pageNumber < totalPages;
      const hasPrevPage = pageNumber > 1;

      return NextResponse.json({
        success: true,
        data: transformedData,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalItems: totalCount || 0,
          itemsPerPage: limitNumber,
          hasNextPage,
          hasPrevPage,
        },
        total: transformedData.length,
        message: 'Default search properties retrieved successfully',
      });
    }

    // Apply search filters
    if (searchkey) {
      query = query.or(`
        project_name.ilike.%${searchkey}%,
        payment_plan.ilike.%${searchkey}%,
        handover.ilike.%${searchkey}%
      `);
    }

    if (areaname) {
      query = query.eq('cities.name', areaname);
    }

    if (cityname) {
      query = query.eq('cities.name', cityname);
    }

    if (property_status) {
      query = query.eq('property_statuses.name', property_status);
    }

    if (developers && developers.length > 0) {
      query = query.in('developers.name', developers);
    }

    if (hasBrochure === true) {
      query = query.not('brochure_url', 'is', null);
    }

    // Get total count for pagination - create a separate count query
    let countQuery = supabaseAdmin
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Apply the same filters to count query
    if (searchkey) {
      countQuery = countQuery.or(`
        project_name.ilike.%${searchkey}%,
        payment_plan.ilike.%${searchkey}%,
        handover.ilike.%${searchkey}%
      `);
    }

    if (areaname) {
      countQuery = countQuery.eq('cities.name', areaname);
    }

    if (cityname) {
      countQuery = countQuery.eq('cities.name', cityname);
    }

    if (property_status) {
      countQuery = countQuery.eq('property_statuses.name', property_status);
    }

    if (developers && developers.length > 0) {
      countQuery = countQuery.in('developers.name', developers);
    }

    if (hasBrochure === true) {
      countQuery = countQuery.not('brochure_url', 'is', null);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting properties:', countError);
      return NextResponse.json(
        { error: 'Failed to count properties' },
        { status: 500 }
      );
    }

    // Execute the query with pagination
    const { data: properties, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNumber - 1);

    if (error) {
      console.error('Error searching properties:', error);
      return NextResponse.json(
        { error: 'Failed to search properties' },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((totalCount || 0) / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    return NextResponse.json({
      success: true,
      data: properties || [],
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalItems: totalCount || 0,
        itemsPerPage: limitNumber,
        hasNextPage,
        hasPrevPage,
      },
      total: properties?.length || 0,
      message: 'Properties retrieved successfully',
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET method for testing (optional)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchkey = searchParams.get('searchkey');
    const areaname = searchParams.get('areaname');
    const cityname = searchParams.get('cityname');
    const property_status = searchParams.get('property_status');
    const developers = searchParams.get('developers')?.split(',');
    const hasBrochure = searchParams.get('hasBrochure') === 'true';

    // Create a mock request body for the POST method
    const mockBody = {
      searchkey,
      areaname,
      cityname,
      property_status,
      developers,
      hasBrochure,
    };

    // Call the POST method with the mock body
    const mockRequest = new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify(mockBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return POST(mockRequest);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
