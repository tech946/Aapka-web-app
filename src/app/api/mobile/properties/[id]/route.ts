import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

/**
 * GET - Get a single property by ID (MOBILE APP - TOKEN AUTHENTICATED)
 * This endpoint returns complete property details including related data
 *
 * Required headers:
 * - Authorization: Bearer <access_token>
 *
 * Path parameter:
 * - id: Property UUID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract Authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized. Please provide a valid access token.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client to verify the token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verify the token and get the user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired access token. Please login again.' },
        { status: 401 }
      );
    }

    // Verify user exists in profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found. Please contact support.' },
        { status: 404 }
      );
    }

    // Get property ID from params
    const propertyId = params.id;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(propertyId)) {
      return NextResponse.json(
        { error: 'Invalid property ID format. Must be a valid UUID.' },
        { status: 400 }
      );
    }

    // Fetch property with all related data
    const { data: property, error: propertyError } = await supabaseAdmin
      .from('properties')
      .select(
        `
        id,
        project_name,
        starting_price,
        property_type_id,
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
          name,
          description,
          image_url
        ),
        property_status (
          name,
          color
        ),
        countries (
          name
        ),
        states (
          name
        ),
        cities (
          name
        ),
        areas (
          name
        ),
        developers (
          name,
          description,
          image_url
        ),
        property_amenities (
          amenities (
            name,
            image_url
          )
        )
      `
      )
      .eq('id', propertyId)
      .single();

    if (propertyError) {
      if (propertyError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Property not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching property:', propertyError);
      return NextResponse.json(
        { error: 'Failed to fetch property', details: propertyError.message },
        { status: 500 }
      );
    }

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Format the response for mobile consumption
    const propertyType = property.property_types as any;
    const propertyStatus = property.property_status as any;
    const country = property.countries as any;
    const state = property.states as any;
    const city = property.cities as any;
    const area = property.areas as any;
    const developer = property.developers as any;

    const formattedProperty = {
      id: property.id,
      projectName: property.project_name,
      startingPrice: property.starting_price,
      images: property.property_images || [],
      thumbnail: property.thumbnail_image,
      brochureUrl: property.brochure_url,
      paymentPlan: property.payment_plan,
      handover: property.handover,
      earnReferral: property.earn_referral,
      isActive: property.is_active,
      createdAt: property.created_at,
      updatedAt: property.updated_at,

      // Property Type (no ID exposed)
      propertyType: propertyType
        ? {
            name: propertyType.name,
            description: propertyType.description,
            imageUrl: propertyType.image_url,
          }
        : null,

      // Status (ID kept for tracking status changes)
      status: propertyStatus
        ? {
            name: propertyStatus.name,
            color: propertyStatus.color,
          }
        : null,

      // Location (no IDs exposed, just names)
      location: {
        country: country?.name || null,
        state: state?.name || null,
        city: city?.name || null,
        area: area?.name || null,
      },

      // Developer (no ID exposed)
      developer: developer
        ? {
            name: developer.name,
            description: developer.description,
            imageUrl: developer.image_url,
          }
        : null,

      // Amenities (no IDs exposed)
      amenities: property.property_amenities
        ? property.property_amenities
            .filter((pa: any) => pa.amenities)
            .map((pa: any) => ({
              name: pa.amenities.name,
              imageUrl: pa.amenities.image_url,
            }))
        : [],
    };

    return NextResponse.json({
      success: true,
      property: formattedProperty,
    });
  } catch (error) {
    console.error('Error in GET /api/mobile/properties/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
