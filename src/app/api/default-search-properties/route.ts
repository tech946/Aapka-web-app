import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET - Get all default search properties
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to access dashboard data.' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Validate pagination parameters
    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    const offset = (page - 1) * limit;

    // Fetch default search properties with full property details
    const {
      data: defaultProperties,
      error,
      count,
    } = await supabaseAdmin
      .from('default_search_properties')
      .select(
        `
        id,
        property_id,
        display_order,
        is_active,
        created_at,
        updated_at,
        properties (
          id,
          project_name,
          starting_price,
          property_type_id,
          unit_types_text,
          property_images,
          thumbnail_image,
          brochure_url,
          payment_plan,
          handover,
          earn_referral,
          property_status_id,
          country_id,
          state_id,
          city_id,
          area_id,
          developer_id,
          is_active,
          created_at,
          updated_at,
          property_types (
            id,
            name,
            image_url
          ),
          property_status (
            id,
            name,
            color
          ),
          countries (
            id,
            name
          ),
          states (
            id,
            name
          ),
          cities (
            id,
            name
          ),
          areas (
            id,
            name
          ),
          developers (
            id,
            name,
            description,
            image_url
          ),
          property_amenities (
            amenity_id,
            amenities (
              id,
              name,
              image_url
            )
          )
        )
      `,
        { count: 'exact' }
      )
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching default search properties:', error);
      return NextResponse.json(
        { error: 'Failed to fetch default search properties' },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      data: defaultProperties || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/default-search-properties:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add properties to default search
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to perform this action.' },
        { status: 401 }
      );
    }

    // Check if user has admin role - use admin client to bypass RLS
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { property_ids, display_orders } = body;

    if (
      !property_ids ||
      !Array.isArray(property_ids) ||
      property_ids.length === 0
    ) {
      return NextResponse.json(
        { error: 'Property IDs array is required' },
        { status: 400 }
      );
    }

    // Validate that all properties exist and are active
    const { data: existingProperties, error: validateError } =
      await supabaseAdmin
        .from('properties')
        .select('id')
        .in('id', property_ids)
        .eq('is_active', true);

    if (validateError) {
      return NextResponse.json(
        { error: 'Failed to validate properties' },
        { status: 500 }
      );
    }

    const existingPropertyIds = existingProperties?.map(p => p.id) || [];
    const invalidIds = property_ids.filter(
      id => !existingPropertyIds.includes(id)
    );

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: `Invalid or inactive property IDs: ${invalidIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Prepare data for insertion
    const insertData = property_ids.map(
      (property_id: string, index: number) => ({
        property_id,
        display_order: display_orders?.[index] || index,
        is_active: true,
        created_by: session.user.id,
      })
    );

    // Insert default search properties
    const { data: insertedProperties, error: insertError } = await supabaseAdmin
      .from('default_search_properties')
      .upsert(insertData, {
        onConflict: 'property_id',
        ignoreDuplicates: false,
      })
      .select();

    if (insertError) {
      console.error('Error inserting default search properties:', insertError);
      return NextResponse.json(
        { error: 'Failed to add properties to default search' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Properties added to default search successfully',
      data: insertedProperties,
    });
  } catch (error) {
    console.error('Error in POST /api/default-search-properties:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Remove properties from default search
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to perform this action.' },
        { status: 401 }
      );
    }

    // Check if user has admin role - use admin client to bypass RLS
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const property_ids = searchParams.get('property_ids');

    if (!property_ids) {
      return NextResponse.json(
        { error: 'Property IDs parameter is required' },
        { status: 400 }
      );
    }

    const propertyIdArray = property_ids.split(',');

    // Delete default search properties
    const { error: deleteError } = await supabaseAdmin
      .from('default_search_properties')
      .delete()
      .in('property_id', propertyIdArray);

    if (deleteError) {
      console.error('Error deleting default search properties:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove properties from default search' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Properties removed from default search successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/default-search-properties:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
