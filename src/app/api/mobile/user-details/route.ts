import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

/**
 * GET - Get logged-in user details (MOBILE APP - TOKEN AUTHENTICATED)
 * This endpoint returns the current authenticated user's details from auth.users
 * and their profile information from the profiles table
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

    // Get user profile from profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found. Please contact support.' },
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
      profile_created_at: profile.created_at,
      profile_updated_at: profile.updated_at,
    });
  } catch (error) {
    console.error('Error in GET /api/mobile/user-details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update user metadata (MOBILE APP - TOKEN AUTHENTICATED)
 * This endpoint allows updating user metadata in auth.users
 *
 * Required headers:
 * - Authorization: Bearer <access_token>
 * - Content-Type: application/json
 *
 * Request body:
 * - user_metadata: object (optional) - User metadata to update
 * - app_metadata: object (optional) - App metadata to update
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
    const { user_metadata, app_metadata } = body;

    // Validate that at least one field is provided
    if (!user_metadata && !app_metadata) {
      return NextResponse.json(
        { error: 'At least one field must be provided for update.' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    if (user_metadata !== undefined) {
      updateData.user_metadata = user_metadata;
    }

    if (app_metadata !== undefined) {
      updateData.app_metadata = app_metadata;
    }

    // Update user metadata using admin client
    const { data: updatedUser, error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, updateData);

    if (updateError) {
      console.error('Error updating user metadata:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to update user metadata',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    // Get updated profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found. Please contact support.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User metadata updated successfully',
      // Updated auth user details
      id: updatedUser.user.id,
      email: updatedUser.user.email,
      email_confirmed_at: updatedUser.user.email_confirmed_at,
      phone: updatedUser.user.phone,
      phone_confirmed_at: updatedUser.user.phone_confirmed_at,
      created_at: updatedUser.user.created_at,
      updated_at: updatedUser.user.updated_at,
      last_sign_in_at: updatedUser.user.last_sign_in_at,
      app_metadata: updatedUser.user.app_metadata,
      user_metadata: updatedUser.user.user_metadata,
      aud: updatedUser.user.aud,
      role: updatedUser.user.role,

      // Profile details (flattened)
      full_name: profile.full_name,
      email_address: profile.email_address,
      profile_image_url: profile.profile_image_url,
      profile_role: profile.role,
      totalleads: profile.totalleads,
      commissions: profile.commissions,
      notes: profile.notes,
      profile_created_at: profile.created_at,
      profile_updated_at: profile.updated_at,
    });
  } catch (error) {
    console.error('Error in PUT /api/mobile/user-details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
