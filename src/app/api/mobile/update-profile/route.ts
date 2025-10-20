import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

/**
 * PUT - Update user profile (MOBILE APP - TOKEN AUTHENTICATED)
 * This endpoint allows authenticated mobile users to update their profile information
 *
 * Required headers:
 * - Authorization: Bearer <access_token>
 *
 * Request body:
 * - full_name: string (required) - User's full name
 * - profile_image_url: string (optional) - Profile image URL (can be empty)
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

    // Parse request body
    const body = await request.json();
    const { full_name, profile_image_url } = body;

    // Validate that full_name is provided
    if (!full_name || full_name.trim() === '') {
      return NextResponse.json(
        { error: 'full_name is required and cannot be empty.' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      full_name: full_name.trim(), // Always update full_name (required)
    };

    // profile_image_url is optional - include it if provided (even if empty)
    if (profile_image_url !== undefined) {
      updateData.profile_image_url = profile_image_url;
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    // Update the profile using admin client
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to update profile', details: updateError.message },
        { status: 500 }
      );
    }

    if (!updatedProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      id: updatedProfile.id,
      full_name: updatedProfile.full_name,
      email_address: updatedProfile.email_address,
      profile_image_url: updatedProfile.profile_image_url,
      role: updatedProfile.role,
      created_at: updatedProfile.created_at,
      updated_at: updatedProfile.updated_at,
    });
  } catch (error) {
    console.error('Error in PUT /api/mobile/update-profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get user profile (MOBILE APP - TOKEN AUTHENTICATED)
 * This endpoint returns the current user's profile information
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

    // Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found. Please contact support.' },
        { status: 404 }
      );
    }

    // Return comprehensive user details in a flat structure
    return NextResponse.json({
      success: true,
      // Auth user details
      id: user.id,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at,
      phone: user.phone,
      phone_confirmed_at: user.phone_confirmed_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_sign_in_at: user.last_sign_in_at,
      app_metadata: user.app_metadata,
      user_metadata: user.user_metadata,
      aud: user.aud,
      role: user.role,

      // Profile details (flattened)
      full_name: profile.full_name,
      email_address: profile.email_address,
      profile_image_url: profile.profile_image_url,
      profile_role: profile.role,
      totalleads: profile.totalleads,
      commissions: profile.commissions,
      notes: profile.notes,
      account_details: profile.account_details,
      profile_created_at: profile.created_at,
      profile_updated_at: profile.updated_at,
    });
  } catch (error) {
    console.error('Error in GET /api/mobile/update-profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
