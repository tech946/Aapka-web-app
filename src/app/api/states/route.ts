import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
// GET - Get all states or states by country_id with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get('country_id');

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
      .from('states')
      .select('*', { count: 'exact', head: true });

    if (countryId) {
      countQuery = countQuery.eq('country_id', countryId);
    }

    // Get total count for pagination metadata
    const { count, error: countError } = await countQuery;

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    // Build query for data
    let query = supabaseAdmin
      .from('states')
      .select('*')
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (countryId) {
      query = query.eq('country_id', countryId);
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

// POST - Create a new state
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    let name, country_id, image_url;

    if (contentType?.includes('multipart/form-data')) {
      // Handle form data with file upload
      const formData = await request.formData();
      name = formData.get('name') as string;
      country_id = formData.get('country_id') as string;
      const file = formData.get('file') as File;

      if (!name || !country_id) {
        return NextResponse.json(
          { error: 'Name and country_id are required' },
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

        // Upload file to supabaseAdmin Storage
        const { data: uploadData, error: uploadError } =
          await supabaseAdmin.storage
            .from('state-images')
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
          .from('state-images')
          .getPublicUrl(fileName);

        image_url = urlData.publicUrl;
      }
    } else {
      // Handle JSON data
      const body = await request.json();
      name = body.name;
      country_id = body.country_id;
      image_url = body.image_url;
    }

    if (!name || !country_id) {
      return NextResponse.json(
        { error: 'Name and country_id are required' },
        { status: 400 }
      );
    }

    // Check if country exists
    const { data: country } = await supabaseAdmin
      .from('countries')
      .select('id')
      .eq('id', country_id)
      .single();

    if (!country) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 });
    }

    // Check if state already exists in this country
    const { data: existingState } = await supabaseAdmin
      .from('states')
      .select('id')
      .eq('name', name)
      .eq('country_id', country_id)
      .single();

    if (existingState) {
      return NextResponse.json(
        { error: 'State already exists in this country' },
        { status: 409 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('states')
      .insert([{ name, country_id, image_url: image_url || null }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Create state error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update a state
export async function PUT(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    let id, name, country_id, image_url, old_image_url;

    if (contentType?.includes('multipart/form-data')) {
      // Handle form data with file upload
      const formData = await request.formData();
      id = formData.get('id') as string;
      name = formData.get('name') as string;
      country_id = formData.get('country_id') as string;
      old_image_url = formData.get('old_image_url') as string;
      const file = formData.get('file') as File;

      if (!id || !name || !country_id) {
        return NextResponse.json(
          { error: 'ID, name, and country_id are required' },
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
        const fileName = `${id}_${Date.now()}.${fileExt}`;

        // Upload file to supabaseAdmin Storage
        const { data: uploadData, error: uploadError } =
          await supabaseAdmin.storage
            .from('state-images')
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
          .from('state-images')
          .getPublicUrl(fileName);

        image_url = urlData.publicUrl;
      } else {
        // No new file, keep existing image
        image_url = old_image_url;
      }
    } else {
      // Handle JSON data
      const body = await request.json();
      id = body.id;
      name = body.name;
      country_id = body.country_id;
      image_url = body.image_url;
      old_image_url = body.old_image_url;
    }

    if (!id || !name || !country_id) {
      return NextResponse.json(
        { error: 'ID, name, and country_id are required' },
        { status: 400 }
      );
    }

    // Check if state exists
    const { data: existingState } = await supabaseAdmin
      .from('states')
      .select('id, image_url')
      .eq('id', id)
      .single();

    if (!existingState) {
      return NextResponse.json({ error: 'State not found' }, { status: 404 });
    }

    // Check if country exists
    const { data: country } = await supabaseAdmin
      .from('countries')
      .select('id')
      .eq('id', country_id)
      .single();

    if (!country) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 });
    }

    // Check if another state with the same name exists in this country
    const { data: duplicateState } = await supabaseAdmin
      .from('states')
      .select('id')
      .eq('name', name)
      .eq('country_id', country_id)
      .neq('id', id)
      .single();

    if (duplicateState) {
      return NextResponse.json(
        { error: 'State with this name already exists in this country' },
        { status: 409 }
      );
    }

    // If image changed, delete old image from storage
    if (
      old_image_url &&
      old_image_url !== image_url &&
      existingState.image_url
    ) {
      try {
        const oldImagePath = existingState.image_url.split('/').pop();
        if (oldImagePath) {
          await supabaseAdmin.storage
            .from('state-images')
            .remove([oldImagePath]);
        }
      } catch (error) {
        console.error('Error deleting old image:', error);
        // Continue with update even if image deletion fails
      }
    }

    const { data, error } = await supabaseAdmin
      .from('states')
      .update({ name, country_id, image_url: image_url || null })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a state
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Check if state exists and get image URL
    const { data: existingState } = await supabaseAdmin
      .from('states')
      .select('id, image_url')
      .eq('id', id)
      .single();

    if (!existingState) {
      return NextResponse.json({ error: 'State not found' }, { status: 404 });
    }

    // Check if state has cities
    const { data: cities } = await supabaseAdmin
      .from('cities')
      .select('id')
      .eq('state_id', id)
      .limit(1);

    if (cities && cities.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete state with existing cities' },
        { status: 409 }
      );
    }

    // Delete associated image from storage if exists
    if (existingState.image_url) {
      try {
        const imagePath = existingState.image_url.split('/').pop();
        if (imagePath) {
          await supabaseAdmin.storage.from('state-images').remove([imagePath]);
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        // Continue with deletion even if image deletion fails
      }
    }

    const { error } = await supabaseAdmin.from('states').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'State deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
