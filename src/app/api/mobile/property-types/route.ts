import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

/**
 * GET - Get all property types (MOBILE APP - TOKEN AUTHENTICATED)
 * This endpoint returns all property types from the database
 *
 * Required headers:
 * - Authorization: Bearer <access_token>
 */
export async function GET(request: NextRequest) {
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

    // Get all property types from database
    const { data: propertyTypes, error } = await supabaseAdmin
      .from('property_types')
      .select(
        `
        id,
        name,
        description,
        image_url
      `
      )
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching property types:', error);
      return NextResponse.json(
        { error: 'Failed to fetch property types' },
        { status: 500 }
      );
    }

    // Format response for mobile
    const formattedPropertyTypes =
      propertyTypes?.map((propertyType: any) => ({
        id: propertyType.id,
        name: propertyType.name,
        description: propertyType.description,
        imageUrl: propertyType.image_url,
      })) || [];

    return NextResponse.json({
      success: true,
      propertyTypes: formattedPropertyTypes,
      total: formattedPropertyTypes.length,
    });
  } catch (error) {
    console.error('Error in GET /api/mobile/property-types:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
