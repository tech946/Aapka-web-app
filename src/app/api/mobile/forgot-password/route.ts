import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST - Send password reset email (MOBILE APP - NO AUTH REQUIRED)
 * This endpoint sends a password reset email to the user
 *
 * Request body:
 * - email: string (required) - User's email address
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { email } = body;

    // Validate email is provided
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Create a Supabase client (no authentication needed for password reset)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Send password reset email via Supabase
    // The mobile app will receive the email and handle the reset screen
    // No redirect happens - the mobile developer shows the reset screen based on API response
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/updatepassword`,
    });

    // Always return success message (for security, don't reveal if email exists)
    // Whether or not the email exists, we return the same message
    return NextResponse.json({
      success: true,
      message:
        'If an account exists with this email, a password reset link has been sent. Please check your email.',
    });
  } catch (error) {
    console.error('Error in POST /api/mobile/forgot-password:', error);
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
