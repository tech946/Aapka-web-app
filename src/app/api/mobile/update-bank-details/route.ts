import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

/**
 * PUT - Update bank details (MOBILE APP - TOKEN AUTHENTICATED)
 * This endpoint allows authenticated mobile users to update their bank details
 * Bank details are stored in the account_details JSONB column in profiles table
 *
 * Required headers:
 * - Authorization: Bearer <access_token>
 * - Content-Type: application/json
 *
 * Request body:
 * - bank_name: string (required) - Bank name
 * - account_number: string (required) - Account number
 * - confirm_account_number: string (required) - Confirm account number (must match account_number)
 * - ifsc_code: string (required) - IFSC code
 */
export async function PUT(request: NextRequest) {
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

    // Parse request body with error handling
    let body;
    let rawText: string | undefined;
    try {
      // Get raw text first for debugging
      rawText = await request.text();
      console.log('Raw request body:', rawText);
      console.log('Raw body length:', rawText.length);
      console.log('Raw body type:', typeof rawText);

      // Clean the JSON string to handle Windows line endings and non-breaking spaces
      const cleanedText = rawText
        .replace(/\r\n/g, '\n') // Convert Windows line endings to Unix
        .replace(/\u00A0/g, ' ') // Replace non-breaking spaces with regular spaces
        .replace(/\u2000-\u200F/g, ' ') // Replace various Unicode spaces with regular spaces
        .trim(); // Remove leading/trailing whitespace

      console.log('Cleaned request body:', cleanedText);

      // Try to parse as JSON
      body = JSON.parse(cleanedText);
      console.log('Parsed JSON body:', body);
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError);
      console.error('Raw body that failed to parse:', rawText);
      return NextResponse.json(
        {
          error: 'Invalid JSON in request body',
          details: 'Please ensure your request contains valid JSON',
          debug: {
            rawBody: rawText || 'undefined',
            cleanedBody: rawText
              ? rawText
                  .replace(/\r\n/g, '\n')
                  .replace(/\u00A0/g, ' ')
                  .trim()
              : 'undefined',
            error:
              jsonError instanceof Error ? jsonError.message : 'Unknown error',
          },
        },
        { status: 400 }
      );
    }

    const { bank_name, account_number, confirm_account_number, ifsc_code } =
      body;

    // Validate required fields
    if (
      !bank_name ||
      !account_number ||
      !confirm_account_number ||
      !ifsc_code
    ) {
      return NextResponse.json(
        {
          error:
            'All fields are required: bank_name, account_number, confirm_account_number, ifsc_code',
        },
        { status: 400 }
      );
    }

    // Validate that account numbers match
    if (account_number !== confirm_account_number) {
      return NextResponse.json(
        { error: 'Account number and confirm account number do not match' },
        { status: 400 }
      );
    }

    // Validate field lengths and formats
    if (bank_name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Bank name must be at least 2 characters long' },
        { status: 400 }
      );
    }

    if (account_number.length < 9 || account_number.length > 18) {
      return NextResponse.json(
        { error: 'Account number must be between 9 and 18 digits' },
        { status: 400 }
      );
    }

    // Validate IFSC code format (4 letters + 7 characters)
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifsc_code.toUpperCase())) {
      return NextResponse.json(
        {
          error:
            'Invalid IFSC code format. Must be 4 letters followed by 7 alphanumeric characters',
        },
        { status: 400 }
      );
    }

    // Validate account number contains only digits
    if (!/^\d+$/.test(account_number)) {
      return NextResponse.json(
        { error: 'Account number must contain only digits' },
        { status: 400 }
      );
    }

    // Prepare account details object
    const accountDetails = {
      bank_name: bank_name.trim(),
      account_number: account_number,
      ifsc_code: ifsc_code.toUpperCase(),
      updated_at: new Date().toISOString(),
    };

    // Update the profile with bank details using admin client (same pattern as update-profile)
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        account_details: accountDetails,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating bank details:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to update bank details',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    if (!updatedProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Bank details updated successfully',
      account_details: accountDetails,
      profile: {
        id: updatedProfile.id,
        full_name: updatedProfile.full_name,
        email_address: updatedProfile.email_address,
        profile_image_url: updatedProfile.profile_image_url,
        role: updatedProfile.role,
        account_details: updatedProfile.account_details,
        created_at: updatedProfile.created_at,
        updated_at: updatedProfile.updated_at,
      },
    });
  } catch (error) {
    console.error('Error in PUT /api/mobile/update-bank-details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get user bank details (MOBILE APP - TOKEN AUTHENTICATED)
 * This endpoint returns the current user's bank details from account_details
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

    // Get user profile with account details
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select(
        'id, full_name, email_address, account_details, created_at, updated_at'
      )
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found. Please contact support.' },
        { status: 404 }
      );
    }

    // Return bank details
    return NextResponse.json({
      success: true,
      id: profile.id,
      full_name: profile.full_name,
      email_address: profile.email_address,
      account_details: profile.account_details || {},
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    });
  } catch (error) {
    console.error('Error in GET /api/mobile/update-bank-details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
