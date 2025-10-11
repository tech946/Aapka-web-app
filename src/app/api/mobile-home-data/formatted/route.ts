import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * GET - Get mobile home data formatted for mobile app consumption (AUTHENTICATED USERS)
 * This endpoint returns the home data with full property and developer details
 * organized exactly as needed for the mobile app
 *
 * This endpoint requires authentication but allows any role (user or admin)
 * Mobile apps need to authenticate users to access this content
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication (any role allowed)
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to access this content.' },
        { status: 401 }
      );
    }

    // Verify user exists in profiles table (any role is fine) - use admin client to bypass RLS
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found. Please contact support.' },
        { status: 404 }
      );
    }

    // Any role (user or admin) can access formatted data
    // Get the most recent active mobile home data
    const { data: homeData, error: homeError } = await supabaseAdmin
      .from('mobile_home_data')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (homeError && homeError.code !== 'PGRST116') {
      return NextResponse.json({ error: homeError.message }, { status: 500 });
    }

    if (!homeData) {
      return NextResponse.json({
        data: {
          featuredVideo: null,
          taglineText: '',
          properties: {},
          developers: [],
          stories: [],
        },
      });
    }

    // Fetch full property details for selected properties
    const propertiesByType = homeData.properties_by_type || [];
    const propertiesObject: { [key: string]: any[] } = {};

    for (const typeGroup of propertiesByType) {
      if (typeGroup.property_ids && typeGroup.property_ids.length > 0) {
        // Fetch properties for this type
        const { data: properties, error: propsError } = await supabaseAdmin
          .from('properties')
          .select(
            `
            id,
            project_name,
            starting_price,
            property_type_id,
            property_images,
            brochure_url,
            payment_plan,
            handover,
            expected_appreciation,
            property_status_id,
            country_id,
            state_id,
            city_id,
            area_id,
            developer_id,
            is_active,
            created_at,
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
          `
          )
          .in('id', typeGroup.property_ids)
          .eq('is_active', true);

        if (!propsError && properties) {
          propertiesObject[typeGroup.property_type_name] = properties;
        }
      }
    }

    // Fetch full developer details for selected developers
    const selectedDevelopers = homeData.selected_developers || [];
    let developersArray: any[] = [];

    if (selectedDevelopers.length > 0) {
      const { data: developers, error: devsError } = await supabaseAdmin
        .from('developers')
        .select('*')
        .in('id', selectedDevelopers);

      if (!devsError && developers) {
        developersArray = developers;
      }
    }

    // Format the response
    const formattedResponse = {
      featuredVideo: homeData.featured_video_url,
      taglineText: homeData.tagline_text,
      properties: propertiesObject,
      developers: developersArray,
      stories: homeData.story_images || [],
    };

    return NextResponse.json({ data: formattedResponse });
  } catch (error) {
    console.error('Error fetching formatted mobile home data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
