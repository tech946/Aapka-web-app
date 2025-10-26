import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST - Reset password using recovery token from email (MOBILE APP - NO AUTH REQUIRED)
 *
 * Flow:
 * 1. User calls POST /api/mobile/forgot-password (receives email with reset link)
 * 2. User clicks link in email (contains access_token in URL hash)
 * 3. Mobile app extracts the access_token from URL
 * 4. Mobile developer shows the "Enter New Password" screen in the app
 * 5. User enters new password
 * 6. Mobile app calls this endpoint with access_token and new password
 * 7. Password is updated
 *
 * Request body:
 * - access_token: string (required) - Token from email reset link
 * - password: string (required) - New password (min 6 characters)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { access_token, password } = body;

    // Validate required fields
    if (!access_token) {
      return NextResponse.json(
        {
          error:
            'Access token is required. Please use the token from the password reset email.',
        },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Create a Supabase client with the access token from the reset email
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Update the password using the session from the recovery token
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/mobile/reset-password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS - Handle preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
