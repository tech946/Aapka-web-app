import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST - Logout user (MOBILE APP - TOKEN AUTHENTICATED)
 * This endpoint logs out an authenticated mobile user
 *
 * Note: Since JWT tokens are stateless, the client should delete the token from secure storage
 * after calling this endpoint
 *
 * Required headers:
 * - Authorization: Bearer <access_token>
 */
export async function POST(request: NextRequest) {
  try {
    // Extract Authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          error: 'Unauthorized. Please provide a valid access token.',
          success: false,
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client to verify the token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );

    // Verify the token and get the user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'Invalid or expired access token',
          success: false,
        },
        { status: 401 }
      );
    }

    // For stateless JWT tokens, logout is primarily a client-side action
    // We can optionally try to sign out on the server
    try {
      await supabase.auth.signOut();
    } catch (signOutError) {
      // If signOut fails, it's okay - the token will expire naturally
      console.log('Server-side signOut not required for stateless tokens');
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully logged out',
      user_id: user.id,
      logout_instructions:
        'Please delete the token from secure storage on the client',
    });
  } catch (error) {
    console.error('Error in POST /api/auth/mobile/logout:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        success: false,
      },
      { status: 500 }
    );
  }
}
