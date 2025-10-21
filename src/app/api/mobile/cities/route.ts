import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET - Get all cities for mobile app (PUBLIC - NO AUTHENTICATION REQUIRED)
 * This endpoint returns all cities from the database
 */
export async function GET(request: NextRequest) {
  try {
    // Get all cities from database
    const { data: cities, error } = await supabaseAdmin
      .from('cities')
      .select(
        `
        id,
        name,
        image_url,
        state_id,
        states (
          id,
          name,
          countries (
            id,
            name
          )
        )
      `
      )
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching cities:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cities' },
        { status: 500 }
      );
    }

    // Format response for mobile
    const formattedCities =
      cities?.map((city: any) => ({
        id: city.id,
        name: city.name,
        imageUrl: city.image_url,
        state: {
          id: city.states?.id,
          name: city.states?.name,
          country: {
            id: city.states?.countries?.id,
            name: city.states?.countries?.name,
          },
        },
      })) || [];

    return NextResponse.json({
      success: true,
      cities: formattedCities,
      total: formattedCities.length,
    });
  } catch (error) {
    console.error('Error in GET /api/mobile/cities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
