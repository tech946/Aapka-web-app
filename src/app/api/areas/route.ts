import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Get all areas or areas by city_id with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cityId = searchParams.get('city_id');

    // Pagination parameters
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit') || '10';
    const page = pageParam ? parseInt(pageParam) : 1;
    const limit = parseInt(limitParam);
    const offset = (page - 1) * limit;

    // Validate pagination parameters
    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    // Build base query for count
    let countQuery = supabaseAdmin
      .from('areas')
      .select('*', { count: 'exact', head: true });

    if (cityId) {
      countQuery = countQuery.eq('city_id', cityId);
    }

    // Get total count for pagination metadata
    const { count, error: countError } = await countQuery;

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    // Build query for data
    let query = supabaseAdmin
      .from('areas')
      .select('*')
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (cityId) {
      query = query.eq('city_id', cityId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new area
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    let name, city_id, image_url;

    if (contentType?.includes('multipart/form-data')) {
      // Handle form data with file upload
      const formData = await request.formData();
      name = formData.get('name') as string;
      city_id = formData.get('city_id') as string;
      const file = formData.get('file') as File;

      if (!name || !city_id) {
        return NextResponse.json(
          { error: 'Name and city_id are required' },
          { status: 400 }
        );
      }

      // Handle file upload if provided
      if (file && file.size > 0) {
        // Validate file type
        const allowedTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
        ];
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json(
            {
              error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed',
            },
            { status: 400 }
          );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          return NextResponse.json(
            { error: 'File size too large. Maximum size is 5MB' },
            { status: 400 }
          );
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `temp_${Date.now()}.${fileExt}`;

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } =
          await supabaseAdmin.storage
            .from('area-images')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false,
            });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          return NextResponse.json(
            { error: 'Failed to upload image: ' + uploadError.message },
            { status: 500 }
          );
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
          .from('area-images')
          .getPublicUrl(fileName);

        image_url = urlData.publicUrl;
      }
    } else {
      // Handle JSON data
      const body = await request.json();
      name = body.name;
      city_id = body.city_id;
      image_url = body.image_url;
    }

    if (!name || !city_id) {
      return NextResponse.json(
        { error: 'Name and city_id are required' },
        { status: 400 }
      );
    }

    // Check if city exists
    const { data: city } = await supabaseAdmin
      .from('cities')
      .select('id')
      .eq('id', city_id)
      .single();

    if (!city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    // Check if area already exists in this city
    const { data: existingArea } = await supabaseAdmin
      .from('areas')
      .select('id')
      .eq('name', name)
      .eq('city_id', city_id)
      .single();

    if (existingArea) {
      return NextResponse.json(
        { error: 'Area already exists in this city' },
        { status: 409 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('areas')
      .insert([{ name, city_id, image_url: image_url || null }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Create area error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update an area
export async function PUT(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    let id, name, city_id, image_url, old_image_url, remove_image;

    if (contentType?.includes('multipart/form-data')) {
      // Handle form data with file upload
      const formData = await request.formData();
      id = formData.get('id') as string;
      name = formData.get('name') as string;
      city_id = formData.get('city_id') as string;
      old_image_url = formData.get('old_image_url') as string;
      remove_image = formData.get('remove_image') as string;
      const file = formData.get('file') as File;

      if (!id || !name || !city_id) {
        return NextResponse.json(
          { error: 'ID, name, and city_id are required' },
          { status: 400 }
        );
      }

      // Handle image removal
      if (remove_image === 'true' && old_image_url) {
        try {
          const oldFileName = old_image_url.split('/').pop();
          if (oldFileName) {
            await supabaseAdmin.storage
              .from('area-images')
              .remove([oldFileName]);
          }
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
        image_url = null;
      }
      // Handle file upload if provided
      else if (file && file.size > 0) {
        // Validate file type
        const allowedTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
        ];
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json(
            {
              error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed',
            },
            { status: 400 }
          );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          return NextResponse.json(
            { error: 'File size too large. Maximum size is 5MB' },
            { status: 400 }
          );
        }

        // Delete old image if exists
        if (old_image_url) {
          try {
            const oldFileName = old_image_url.split('/').pop();
            if (oldFileName) {
              await supabaseAdmin.storage
                .from('area-images')
                .remove([oldFileName]);
            }
          } catch (error) {
            console.error('Error deleting old image:', error);
          }
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `temp_${Date.now()}.${fileExt}`;

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } =
          await supabaseAdmin.storage
            .from('area-images')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false,
            });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          return NextResponse.json(
            { error: 'Failed to upload image: ' + uploadError.message },
            { status: 500 }
          );
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
          .from('area-images')
          .getPublicUrl(fileName);

        image_url = urlData.publicUrl;
      }
    } else {
      // Handle JSON data
      const body = await request.json();
      id = body.id;
      name = body.name;
      city_id = body.city_id;
      image_url = body.image_url;
      old_image_url = body.old_image_url;
    }

    if (!id || !name || !city_id) {
      return NextResponse.json(
        { error: 'ID, name, and city_id are required' },
        { status: 400 }
      );
    }

    // Check if area exists
    const { data: existingArea } = await supabaseAdmin
      .from('areas')
      .select('id, image_url')
      .eq('id', id)
      .single();

    if (!existingArea) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 });
    }

    // Check if city exists
    const { data: city } = await supabaseAdmin
      .from('cities')
      .select('id')
      .eq('id', city_id)
      .single();

    if (!city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    // Check if another area with the same name exists in this city
    const { data: duplicateArea } = await supabaseAdmin
      .from('areas')
      .select('id')
      .eq('name', name)
      .eq('city_id', city_id)
      .neq('id', id)
      .single();

    if (duplicateArea) {
      return NextResponse.json(
        { error: 'Area with this name already exists in this city' },
        { status: 409 }
      );
    }

    // Prepare update data
    const updateData: any = {
      name,
      city_id,
    };

    // Only update image_url if it was explicitly set (including null for removal)
    if (image_url !== undefined) {
      updateData.image_url = image_url;
    }

    const { data, error } = await supabaseAdmin
      .from('areas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Update area error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an area
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Check if area exists and get its image URL
    const { data: existingArea } = await supabaseAdmin
      .from('areas')
      .select('id, image_url')
      .eq('id', id)
      .single();

    if (!existingArea) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 });
    }

    // Delete the image from storage if it exists
    if (existingArea.image_url) {
      try {
        const fileName = existingArea.image_url.split('/').pop();
        if (fileName) {
          await supabaseAdmin.storage.from('area-images').remove([fileName]);
        }
      } catch (error) {
        console.error('Error deleting area image:', error);
        // Continue with area deletion even if image deletion fails
      }
    }

    const { error } = await supabaseAdmin.from('areas').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Area deleted successfully' });
  } catch (error) {
    console.error('Delete area error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
