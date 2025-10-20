import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET - Get mobile home data (PROTECTED - admin only for dashboard)
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin role
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to access dashboard data.' },
        { status: 401 }
      );
    }

    // Check if user has admin role - use admin client to bypass RLS
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

    // Get the most recent active mobile home data
    const { data, error } = await supabaseAdmin
      .from('mobile_home_data')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows found" which we handle gracefully
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      // Return default empty structure if no data exists
      return NextResponse.json({
        data: {
          id: null,
          featured_video_url: null,
          tagline_text: '',
          properties_by_type: [],
          selected_developers: [],
          story_images: [],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });
    }

    // Handle properties_by_type - convert to object format { "Apartment": [...], "Villa": [...] }
    let propertiesObject: { [key: string]: any[] } = {};

    if (data.properties_by_type) {
      // Check if already in object format
      if (!Array.isArray(data.properties_by_type)) {
        // Already an object, use as is
        propertiesObject = data.properties_by_type;
      } else if (
        Array.isArray(data.properties_by_type) &&
        data.properties_by_type.length > 0
      ) {
        // Old array format, convert to object
        for (const typeGroup of data.properties_by_type) {
          // Check if we have full property objects or just IDs
          if (typeGroup.properties && Array.isArray(typeGroup.properties)) {
            // Already have full property objects (array format)
            propertiesObject[typeGroup.property_type_name] =
              typeGroup.properties;
          } else if (
            typeGroup.property_ids &&
            typeGroup.property_ids.length > 0
          ) {
            // Have IDs only, fetch full property details (backward compatibility)
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
                earn_referral,
                property_status_id,
                country_id,
                state_id,
                city_id,
                area_id,
                developer_id,
                is_active,
                created_at,
                property_types (
                  id,
                  name,
                  image_url
                ),
                property_status (
                  id,
                  name,
                  color
                ),
                countries (
                  id,
                  name
                ),
                states (
                  id,
                  name
                ),
                cities (
                  id,
                  name
                ),
                areas (
                  id,
                  name
                ),
                developers (
                  id,
                  name,
                  description,
                  image_url
                ),
                property_amenities (
                  amenity_id,
                  amenities (
                    id,
                    name,
                    image_url
                  )
                )
              `
              )
              .in('id', typeGroup.property_ids)
              .eq('is_active', true);

            if (!propsError && properties) {
              propertiesObject[typeGroup.property_type_name] = properties;
            }
          }
        }
      }
    }

    // Handle selected_developers - check if they're already full objects or just IDs
    let developersWithDetails = [];
    if (
      data.selected_developers &&
      Array.isArray(data.selected_developers) &&
      data.selected_developers.length > 0
    ) {
      // Check if first item is an object (full developer data) or a string (just ID)
      if (
        typeof data.selected_developers[0] === 'object' &&
        data.selected_developers[0] !== null
      ) {
        // Already have full developer objects, use them as is
        developersWithDetails = data.selected_developers;
      } else {
        // Have IDs only, fetch full developer details (backward compatibility)
        const { data: developers, error: devsError } = await supabaseAdmin
          .from('developers')
          .select('*')
          .in('id', data.selected_developers);

        if (!devsError && developers) {
          developersWithDetails = developers;
        }
      }
    }

    // Return data with full objects in new format
    return NextResponse.json({
      data: {
        ...data,
        properties_by_type: propertiesObject, // Object format: { "Apartment": [...], "Villa": [...] }
        selected_developers: developersWithDetails,
      },
    });
  } catch (error) {
    console.error('Error fetching mobile home data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create or update mobile home data (PROTECTED - admin only)
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

    // Check if user has admin role - use admin client to bypass RLS
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

    // Check content length before parsing FormData
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) {
      // 50MB limit
      return NextResponse.json(
        { error: 'Request too large. Maximum 50MB allowed.' },
        { status: 413 }
      );
    }

    const formData = await request.formData();

    const id = formData.get('id') as string;
    const taglineText = formData.get('tagline_text') as string;
    const propertiesByType = formData.get('properties_by_type') as string;
    const selectedDevelopers = formData.get('selected_developers') as string;
    const videoFile = formData.get('video_file') as File;
    const storyImageFiles = formData.getAll('story_images') as File[];
    const existingVideoUrl = formData.get('existing_video_url') as string;
    const deleteVideo = formData.get('delete_video') as string;
    const existingStoryImagesStr = formData.get(
      'existing_story_images'
    ) as string;
    const storyImagesToDeleteStr = formData.get(
      'story_images_to_delete'
    ) as string;

    // Handle video deletion if requested
    if (deleteVideo === 'true' && existingVideoUrl) {
      try {
        const urlParts = existingVideoUrl.split('/videos/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabaseAdmin.storage.from('videos').remove([filePath]);
        }
      } catch (deleteError) {
        console.error('Error deleting video:', deleteError);
      }
    }

    // Handle video upload if provided
    let videoUrl = deleteVideo === 'true' ? null : existingVideoUrl || null;

    if (videoFile && videoFile.size > 0) {
      // Validate video file
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

      if (videoFile.size > 20 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Video file size too large. Maximum 20MB allowed.' },
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
      const filePath = `${fileName}`;

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

    // Handle story images
    let finalStoryImages: string[] = [];

    // Parse existing images (images that weren't deleted)
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

    // Upload new story images if provided
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
    let propertiesByTypeObject: { [key: string]: any[] } = {}; // Changed to object format

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

    // Fetch full property details to store in database
    if (
      parsedPropertiesByType &&
      Array.isArray(parsedPropertiesByType) &&
      parsedPropertiesByType.length > 0
    ) {
      for (const typeGroup of parsedPropertiesByType) {
        // Process all property types, even those with empty property_ids
        if (typeGroup.property_ids && typeGroup.property_ids.length > 0) {
          // Fetch full property details for this type
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
              property_types (
                id,
                name,
                image_url
              ),
              property_status (
                id,
                name,
                color
              ),
              countries (
                id,
                name
              ),
              states (
                id,
                name
              ),
              cities (
                id,
                name
              ),
              areas (
                id,
                name
              ),
              developers (
                id,
                name,
                description,
                image_url
              ),
              property_amenities (
                amenity_id,
                amenities (
                  id,
                  name,
                  image_url
                )
              )
            `
            )
            .in('id', typeGroup.property_ids)
            .eq('is_active', true);

          if (propsError) {
            console.error('Error fetching properties:', propsError);
            // Store empty array even on error
            propertiesByTypeObject[typeGroup.property_type_name] = [];
          } else if (!properties || properties.length === 0) {
            console.warn(
              `No properties found for ${typeGroup.property_type_name} with IDs:`,
              typeGroup.property_ids
            );
            // Store empty array
            propertiesByTypeObject[typeGroup.property_type_name] = [];
          } else {
            // Store full property objects as array under property type name key
            propertiesByTypeObject[typeGroup.property_type_name] = properties;
          }
        } else {
          // Handle property types with no selected properties
          propertiesByTypeObject[typeGroup.property_type_name] = [];
        }
      }
    }

    // Fetch full developer details to store in database
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
      properties_by_type: propertiesByTypeObject, // Store as object: { "Apartment": [...], "Villa": [...] }
      selected_developers: developersWithFullDetails, // Store full developer objects
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete mobile home data (PROTECTED - admin only)
export async function DELETE(request: NextRequest) {
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

    // Check if user has admin role - use admin client to bypass RLS
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Get the record to delete associated files
    const { data: homeData, error: fetchError } = await supabaseAdmin
      .from('mobile_home_data')
      .select('featured_video_url, story_images')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Delete featured video if exists
    if (homeData.featured_video_url) {
      try {
        const urlParts = homeData.featured_video_url.split('/videos/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabaseAdmin.storage.from('videos').remove([filePath]);
        }
      } catch (deleteError) {
        console.error('Error deleting video:', deleteError);
      }
    }

    // Delete story images if exist
    if (homeData.story_images && Array.isArray(homeData.story_images)) {
      for (const imageUrl of homeData.story_images) {
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

    // Delete the record
    const { error } = await supabaseAdmin
      .from('mobile_home_data')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Mobile home data deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting mobile home data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
