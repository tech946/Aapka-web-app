import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

/**
 * POST - Upload profile image (MOBILE APP - TOKEN AUTHENTICATED)
 * This endpoint allows authenticated mobile users to upload profile images
 * Images are stored in the 'profile-images' bucket in Supabase Storage
 *
 * Required headers:
 * - Authorization: Bearer <access_token>
 * - Content-Type: multipart/form-data
 *
 * Request body:
 * - image: File - The image file to upload
 */
export async function POST(request: NextRequest) {
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

    // Parse the form data
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
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

    // Generate unique filename
    const fileExtension = imageFile.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}-${Date.now()}.${fileExtension}`;
    const filePath = `profile-images/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload image to Supabase Storage using admin client
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
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

    // Get the public URL for the uploaded image
    const { data: urlData } = supabaseAdmin.storage
      .from('profile-images')
      .getPublicUrl(filePath);

    const imageUrl = urlData.publicUrl;

    // Update the user's profile with the new image URL
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        profile_image_url: imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile with image URL:', updateError);
      // Try to delete the uploaded image if profile update fails
      await supabaseAdmin.storage.from('profile-images').remove([filePath]);

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
      message: 'Profile image uploaded successfully',
      image_url: imageUrl,
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
    return NextResponse.json(
      { error: 'Internal server error' },
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

    // Get current profile to find the image URL
    const { data: profile, error: profileError } = await supabaseAdmin
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

      // Delete from storage (ignore errors if file doesn't exist)
      await supabaseAdmin.storage.from('profile-images').remove([filePath]);
    }

    // Update profile to remove image URL
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
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
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
