import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// POST - Handle large file uploads for mobile home data
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

    // Get the content type to determine if this is a file upload
    const contentType = request.headers.get('content-type') || '';

    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Content-Type must be multipart/form-data' },
        { status: 400 }
      );
    }

    // Check content length
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Request too large. Maximum 50MB allowed.' },
        { status: 413 }
      );
    }

    // Process the request as FormData
    const formData = await request.formData();

    // Extract files and data
    const videoFile = formData.get('video_file') as File;
    const storyImageFiles = formData.getAll('story_images') as File[];
    const id = formData.get('id') as string;
    const taglineText = formData.get('tagline_text') as string;
    const propertiesByType = formData.get('properties_by_type') as string;
    const selectedDevelopers = formData.get('selected_developers') as string;
    const existingVideoUrl = formData.get('existing_video_url') as string;
    const deleteVideo = formData.get('delete_video') as string;
    const existingStoryImagesStr = formData.get(
      'existing_story_images'
    ) as string;
    const storyImagesToDeleteStr = formData.get(
      'story_images_to_delete'
    ) as string;

    // Validate file sizes before processing
    if (videoFile && videoFile.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Video file size too large. Maximum 20MB allowed.' },
        { status: 400 }
      );
    }

    // Check total size of story images
    const totalStoryImagesSize = storyImageFiles.reduce(
      (total, file) => total + file.size,
      0
    );
    if (totalStoryImagesSize > 25 * 1024 * 1024) {
      // 25MB total for all story images
      return NextResponse.json(
        { error: 'Total story images size too large. Maximum 25MB allowed.' },
        { status: 400 }
      );
    }

    // Process video upload if provided
    let videoUrl = deleteVideo === 'true' ? null : existingVideoUrl || null;

    if (videoFile && videoFile.size > 0) {
      // Validate video file type
      const allowedTypes = [
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo',
        'video/webm',
      ];

      if (!allowedTypes.includes(videoFile.type)) {
        return NextResponse.json(
          {
            error:
              'Invalid video type. Only MP4, MOV, AVI, and WebM are allowed.',
          },
          { status: 400 }
        );
      }

      // Delete old video if exists
      if (existingVideoUrl) {
        try {
          const urlParts = existingVideoUrl.split('/videos/');
          if (urlParts.length > 1) {
            const filePath = urlParts[1];
            await supabaseAdmin.storage.from('videos').remove([filePath]);
          }
        } catch (deleteError) {
          console.error('Error deleting old video:', deleteError);
        }
      }

      // Upload new video
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabaseAdmin.storage
        .from('videos')
        .upload(filePath, videoFile);

      if (uploadError) {
        return NextResponse.json(
          { error: `Failed to upload video: ${uploadError.message}` },
          { status: 500 }
        );
      }

      const {
        data: { publicUrl },
      } = supabaseAdmin.storage.from('videos').getPublicUrl(filePath);

      videoUrl = publicUrl;
    }

    // Process story images
    let finalStoryImages: string[] = [];

    // Parse existing images
    try {
      if (existingStoryImagesStr) {
        const existingImages = JSON.parse(existingStoryImagesStr);
        if (Array.isArray(existingImages)) {
          finalStoryImages = existingImages;
        }
      }
    } catch (e) {
      console.error('Error parsing existing story images:', e);
    }

    // Delete story images marked for deletion
    try {
      if (storyImagesToDeleteStr) {
        const imagesToDelete = JSON.parse(storyImagesToDeleteStr);
        if (Array.isArray(imagesToDelete) && imagesToDelete.length > 0) {
          for (const imageUrl of imagesToDelete) {
            try {
              const urlParts = imageUrl.split('/mobile-stories/');
              if (urlParts.length > 1) {
                const filePath = urlParts[1];
                await supabaseAdmin.storage
                  .from('mobile-stories')
                  .remove([filePath]);
              }
            } catch (deleteError) {
              console.error('Error deleting story image:', deleteError);
            }
          }
        }
      }
    } catch (e) {
      console.error('Error parsing story images to delete:', e);
    }

    // Upload new story images
    if (storyImageFiles && storyImageFiles.length > 0) {
      for (const imageFile of storyImageFiles) {
        if (imageFile && imageFile.size > 0) {
          // Validate file is an image
          if (!imageFile.type.startsWith('image/')) {
            continue;
          }

          if (imageFile.size > 5 * 1024 * 1024) {
            console.warn(`Story image ${imageFile.name} exceeds 5MB, skipping`);
            continue;
          }

          const fileExt = imageFile.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = fileName;

          const { error: uploadError } = await supabaseAdmin.storage
            .from('mobile-stories')
            .upload(filePath, imageFile);

          if (uploadError) {
            console.error('Failed to upload story image:', uploadError);
            continue;
          }

          const {
            data: { publicUrl },
          } = supabaseAdmin.storage
            .from('mobile-stories')
            .getPublicUrl(filePath);

          finalStoryImages.push(publicUrl);
        }
      }
    }

    // Parse JSON fields
    let parsedPropertiesByType = [];
    let parsedSelectedDevelopers = [];
    let developersWithFullDetails = [];
    let propertiesByTypeObject: { [key: string]: any[] } = {};

    try {
      if (propertiesByType) {
        parsedPropertiesByType = JSON.parse(propertiesByType);
      }
    } catch (e) {
      console.error('Error parsing properties_by_type:', e);
    }

    try {
      if (selectedDevelopers) {
        parsedSelectedDevelopers = JSON.parse(selectedDevelopers);
      }
    } catch (e) {
      console.error('Error parsing selected_developers:', e);
    }

    // Fetch full property details
    if (
      parsedPropertiesByType &&
      Array.isArray(parsedPropertiesByType) &&
      parsedPropertiesByType.length > 0
    ) {
      for (const typeGroup of parsedPropertiesByType) {
        if (typeGroup.property_ids && typeGroup.property_ids.length > 0) {
          const { data: properties, error: propsError } = await supabaseAdmin
            .from('properties')
            .select(
              `
              id,
              project_name,
              starting_price,
              property_type_id,
              property_images,
              brochure_url,
              payment_plan,
              handover,
              property_status_id,
              country_id,
              state_id,
              city_id,
              area_id,
              developer_id,
              is_active,
              created_at,
              property_types (id, name, image_url),
              property_status (id, name, color),
              countries (id, name),
              states (id, name),
              cities (id, name),
              areas (id, name),
              developers (id, name, description, image_url),
              property_amenities (
                amenity_id,
                amenities (id, name, image_url)
              )
            `
            )
            .in('id', typeGroup.property_ids)
            .eq('is_active', true);

          if (propsError) {
            console.error('Error fetching properties:', propsError);
            propertiesByTypeObject[typeGroup.property_type_name] = [];
          } else if (!properties || properties.length === 0) {
            console.warn(
              `No properties found for ${typeGroup.property_type_name} with IDs:`,
              typeGroup.property_ids
            );
            propertiesByTypeObject[typeGroup.property_type_name] = [];
          } else {
            propertiesByTypeObject[typeGroup.property_type_name] = properties;
          }
        } else {
          propertiesByTypeObject[typeGroup.property_type_name] = [];
        }
      }
    }

    // Fetch full developer details
    if (
      parsedSelectedDevelopers &&
      Array.isArray(parsedSelectedDevelopers) &&
      parsedSelectedDevelopers.length > 0
    ) {
      const { data: developers, error: devsError } = await supabaseAdmin
        .from('developers')
        .select('*')
        .in('id', parsedSelectedDevelopers);

      if (!devsError && developers) {
        developersWithFullDetails = developers;
      }
    }

    // Prepare data for insert/update
    const homeData = {
      featured_video_url: videoUrl,
      tagline_text: taglineText || '',
      properties_by_type: propertiesByTypeObject,
      selected_developers: developersWithFullDetails,
      story_images: finalStoryImages,
      is_active: true,
    };

    let result;

    if (id && id !== 'null' && id !== 'undefined') {
      // Update existing record
      const { data, error } = await supabaseAdmin
        .from('mobile_home_data')
        .update(homeData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      result = data;
    } else {
      // Deactivate all existing records first
      await supabaseAdmin
        .from('mobile_home_data')
        .update({ is_active: false })
        .eq('is_active', true);

      // Create new record
      const { data, error } = await supabaseAdmin
        .from('mobile_home_data')
        .insert([homeData])
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      result = data;
    }

    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    console.error('Error saving mobile home data:', error);

    // Check if it's a size-related error
    if (error instanceof Error && error.message.includes('too large')) {
      return NextResponse.json(
        { error: 'Request too large. Please reduce file sizes and try again.' },
        { status: 413 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
