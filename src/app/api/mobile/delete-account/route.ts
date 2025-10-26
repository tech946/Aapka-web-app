import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

/**
 * DELETE - Delete user account (MOBILE APP - TOKEN AUTHENTICATED)
 * This endpoint allows authenticated mobile users to permanently delete their account
 *
 * This will:
 * 1. Delete the user's profile from the profiles table
 * 2. Delete the user's auth account from auth.users
 * 3. Delete any associated files (profile images, etc.)
 *
 * Required headers:
 * - Authorization: Bearer <access_token>
 */
export async function DELETE(request: NextRequest) {
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
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verify the token and get the user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        {
          error: 'Invalid or expired access token. Please login again.',
          success: false,
        },
        { status: 401 }
      );
    }

    const userId = user.id;

    try {
      // 1. Delete profile image from storage if exists
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('profile_image_url')
        .eq('id', userId)
        .single();

      if (profile?.profile_image_url) {
        try {
          // Extract file path from URL
          const urlParts = profile.profile_image_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const filePath = `profile-images/${fileName}`;

          // Delete from storage
          await supabaseAdmin.storage.from('profile-images').remove([filePath]);
        } catch (storageError) {
          console.error('Error deleting profile image:', storageError);
          // Continue with account deletion even if image deletion fails
        }
      }

      // 2. Delete user's profile from profiles table
      const { error: profileDeleteError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileDeleteError) {
        console.error('Error deleting profile:', profileDeleteError);
        return NextResponse.json(
          {
            error: 'Failed to delete profile',
            details: profileDeleteError.message,
            success: false,
          },
          { status: 500 }
        );
      }

      // 3. Delete user's auth account from auth.users using admin API
      const { data: deleteData, error: authDeleteError } =
        await supabaseAdmin.auth.admin.deleteUser(userId);

      if (authDeleteError) {
        console.error('Error deleting auth user:', authDeleteError);

        // If profile is already deleted but auth deletion fails,
        // the account is in a partial state - still return error
        return NextResponse.json(
          {
            error: 'Failed to delete account',
            details: authDeleteError.message,
            success: false,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Account deleted successfully',
        user_id: userId,
      });
    } catch (deleteError: any) {
      console.error('Error during account deletion:', deleteError);
      return NextResponse.json(
        {
          error: 'Failed to delete account',
          details: deleteError.message || 'Unknown error',
          success: false,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in DELETE /api/mobile/delete-account:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message || 'Unknown error',
        success: false,
      },
      { status: 500 }
    );
  }
}
