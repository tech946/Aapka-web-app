import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// POST - Generate signed upload URLs for direct client-to-storage uploads
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to perform this action.' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { fileType, fileName, fileSize } = body;

    // Validate file type
    const allowedVideoTypes = [
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
    ];

    const allowedImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    const isVideo = allowedVideoTypes.includes(fileType);
    const isImage = allowedImageTypes.includes(fileType);

    if (!isVideo && !isImage) {
      return NextResponse.json(
        { error: 'Invalid file type. Only videos and images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (isVideo && fileSize > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Video file size too large. Maximum 20MB allowed.' },
        { status: 400 }
      );
    }

    if (isImage && fileSize > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Image file size too large. Maximum 5MB allowed.' },
        { status: 400 }
      );
    }

    // Generate unique file path
    const fileExt = fileName.split('.').pop();
    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Determine bucket and path based on file type
    const bucket = isVideo ? 'videos' : 'mobile-stories';
    const filePath = uniqueFileName;

    // Generate signed upload URL
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(filePath);

    if (error) {
      return NextResponse.json(
        { error: `Failed to generate upload URL: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      uploadUrl: data.signedUrl,
      filePath: filePath,
      bucket: bucket,
      publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`,
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
