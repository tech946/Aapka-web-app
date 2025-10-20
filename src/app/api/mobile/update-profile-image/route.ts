import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

/**
 * POST - Upload or update profile image (MOBILE APP - TOKEN AUTHENTICATED)
 * This endpoint allows authenticated mobile users to upload profile images or update with image URLs
 * Images are stored in the 'profile-images' bucket in Supabase Storage
 *
 * Required headers:
 * - Authorization: Bearer <access_token>
 * - Content-Type: multipart/form-data OR application/json
 *
 * Request body options:
 * Option 1 (File upload):
 * - Content-Type: multipart/form-data
 * - image: File - The image file to upload
 *
 * Option 2 (URL update):
 * - Content-Type: application/json
 * - profile_image_url: string - The image URL to set
 */
export async function POST(request: NextRequest) {
  try {
    // Check environment variables
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      console.error('Missing required environment variables');
      return NextResponse.json(
        { error: 'Server configuration error. Missing environment variables.' },
        { status: 500 }
      );
    }

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
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: 'Invalid or expired access token. Please login again.' },
        { status: 401 }
      );
    }

    // Check content type and parse accordingly
    const contentType = request.headers.get('content-type') || '';
    console.log('Content-Type received:', contentType);

    // Check content length before parsing FormData
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      // 10MB limit for profile images
      return NextResponse.json(
        {
          error: 'Request too large. Maximum 10MB allowed for profile images.',
        },
        { status: 413 }
      );
    }

    let imageFile: File | null = null;
    let profileImageUrl: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      imageFile = formData.get('image') as File;

      if (!imageFile) {
        return NextResponse.json(
          { error: 'No image file provided' },
          { status: 400 }
        );
      }
    } else if (contentType.includes('application/json')) {
      // Handle JSON with image URL
      try {
        const body = await request.json();
        profileImageUrl = body.profile_image_url || body.image_url;

        if (!profileImageUrl) {
          return NextResponse.json(
            { error: 'No profile_image_url provided in JSON body' },
            { status: 400 }
          );
        }
      } catch (jsonError) {
        return NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        );
      }
    } else {
      // Try to handle as JSON if content type is not properly detected
      console.log('Unknown content type, trying JSON fallback...');
      try {
        const body = await request.json();
        profileImageUrl = body.profile_image_url || body.image_url;

        if (!profileImageUrl) {
          return NextResponse.json(
            { error: 'No profile_image_url provided in JSON body' },
            { status: 400 }
          );
        }
      } catch (jsonError) {
        return NextResponse.json(
          {
            error: 'Unsupported content type',
            details:
              'Content-Type must be either "multipart/form-data" or "application/json"',
            receivedContentType: contentType,
          },
          { status: 400 }
        );
      }
    }

    // Validate file type (only for file uploads)
    if (imageFile) {
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
      ];
      if (!allowedTypes.includes(imageFile.type)) {
        return NextResponse.json(
          {
            error:
              'Invalid file type. Only JPEG, PNG, and WebP images are allowed.',
          },
          { status: 400 }
        );
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (imageFile.size > maxSize) {
        return NextResponse.json(
          { error: 'File size too large. Maximum size is 5MB.' },
          { status: 400 }
        );
      }
    }

    let finalImageUrl: string;

    if (imageFile) {
      // Handle file upload
      // Generate unique filename
      const fileExtension = imageFile.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExtension}`;
      const filePath = `profile-images/${fileName}`;

      // Convert File to ArrayBuffer
      const arrayBuffer = await imageFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Upload image to Supabase Storage using admin client (only for storage operations)
      const { data: uploadData, error: uploadError } =
        await supabaseAdmin.storage
          .from('profile-images')
          .upload(filePath, uint8Array, {
            contentType: imageFile.type,
            cacheControl: '3600',
            upsert: false, // Don't overwrite existing files
          });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload image', details: uploadError.message },
          { status: 500 }
        );
      }

      // Get the public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      finalImageUrl = urlData.publicUrl;
    } else {
      // Handle URL update
      finalImageUrl = profileImageUrl!;
    }

    // Update the user's profile with the new image URL using admin client
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        profile_image_url: finalImageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile with image URL:', updateError);
      // Try to delete the uploaded image if profile update fails (only for file uploads)
      if (imageFile) {
        const fileExtension = imageFile.name.split('.').pop() || 'jpg';
        const fileName = `${user.id}-${Date.now()}.${fileExtension}`;
        const filePath = `profile-images/${fileName}`;
        await supabaseAdmin.storage.from('profile-images').remove([filePath]);
      }

      return NextResponse.json(
        {
          error: 'Failed to update profile with image URL',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: imageFile
        ? 'Profile image uploaded successfully'
        : 'Profile image URL updated successfully',
      image_url: finalImageUrl,
      profile: {
        id: updatedProfile.id,
        full_name: updatedProfile.full_name,
        email_address: updatedProfile.email_address,
        profile_image_url: updatedProfile.profile_image_url,
        phone: updatedProfile.phone,
        notes: updatedProfile.notes,
        role: updatedProfile.role,
        created_at: updatedProfile.created_at,
        updated_at: updatedProfile.updated_at,
      },
    });
  } catch (error) {
    console.error('Error in POST /api/mobile/update-profile-image:', error);

    // Check if it's a size-related error
    if (error instanceof Error && error.message.includes('too large')) {
      return NextResponse.json(
        { error: 'Request too large. Please reduce file size and try again.' },
        { status: 413 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete profile image (MOBILE APP - TOKEN AUTHENTICATED)
 * This endpoint allows authenticated mobile users to delete their profile image
 *
 * Required headers:
 * - Authorization: Bearer <access_token>
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check environment variables
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      console.error('Missing required environment variables');
      return NextResponse.json(
        { error: 'Server configuration error. Missing environment variables.' },
        { status: 500 }
      );
    }

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
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: 'Invalid or expired access token. Please login again.' },
        { status: 401 }
      );
    }

    // Get current profile to find the image URL using regular authenticated client
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('profile_image_url')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // If there's an existing image, try to delete it from storage
    if (profile.profile_image_url) {
      // Extract file path from URL
      const urlParts = profile.profile_image_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `profile-images/${fileName}`;

      // Delete from storage using admin client (only for storage operations)
      await supabaseAdmin.storage.from('profile-images').remove([filePath]);
    }

    // Update profile to remove image URL using regular authenticated client
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        profile_image_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error removing profile image URL:', updateError);
      return NextResponse.json(
        {
          error: 'Failed to remove profile image',
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile image deleted successfully',
      profile: {
        id: updatedProfile.id,
        full_name: updatedProfile.full_name,
        email_address: updatedProfile.email_address,
        profile_image_url: updatedProfile.profile_image_url,
        phone: updatedProfile.phone,
        notes: updatedProfile.notes,
        role: updatedProfile.role,
        created_at: updatedProfile.created_at,
        updated_at: updatedProfile.updated_at,
      },
    });
  } catch (error) {
    console.error('Error in DELETE /api/mobile/update-profile-image:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
