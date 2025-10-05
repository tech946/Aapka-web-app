import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Get all cities or cities by state_id with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stateId = searchParams.get('state_id');

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
      .from('cities')
      .select('*', { count: 'exact', head: true });

    if (stateId) {
      countQuery = countQuery.eq('state_id', stateId);
    }

    // Get total count for pagination metadata
    const { count, error: countError } = await countQuery;

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    // Build query for data
    let query = supabaseAdmin
      .from('cities')
      .select('*')
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (stateId) {
      query = query.eq('state_id', stateId);
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

// POST - Create a new city
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    let name, state_id, image_url;

    if (contentType?.includes('multipart/form-data')) {
      // Handle form data with file upload
      const formData = await request.formData();
      name = formData.get('name') as string;
      state_id = formData.get('state_id') as string;
      const file = formData.get('file') as File;

      if (!name || !state_id) {
        return NextResponse.json(
          { error: 'Name and state_id are required' },
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
            .from('city-images')
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
          .from('city-images')
          .getPublicUrl(fileName);

        image_url = urlData.publicUrl;
      }
    } else {
      // Handle JSON data
      const body = await request.json();
      name = body.name;
      state_id = body.state_id;
      image_url = body.image_url;
    }

    if (!name || !state_id) {
      return NextResponse.json(
        { error: 'Name and state_id are required' },
        { status: 400 }
      );
    }

    // Check if state exists
    const { data: state } = await supabaseAdmin
      .from('states')
      .select('id')
      .eq('id', state_id)
      .single();

    if (!state) {
      return NextResponse.json({ error: 'State not found' }, { status: 404 });
    }

    // Check if city already exists in this state
    const { data: existingCity } = await supabaseAdmin
      .from('cities')
      .select('id')
      .eq('name', name)
      .eq('state_id', state_id)
      .single();

    if (existingCity) {
      return NextResponse.json(
        { error: 'City already exists in this state' },
        { status: 409 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('cities')
      .insert([{ name, state_id, image_url: image_url || null }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Create city error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update a city
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, state_id } = body;

    if (!id || !name || !state_id) {
      return NextResponse.json(
        { error: 'ID, name, and state_id are required' },
        { status: 400 }
      );
    }

    // Check if city exists
    const { data: existingCity } = await supabaseAdmin
      .from('cities')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingCity) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    // Check if state exists
    const { data: state } = await supabaseAdmin
      .from('states')
      .select('id')
      .eq('id', state_id)
      .single();

    if (!state) {
      return NextResponse.json({ error: 'State not found' }, { status: 404 });
    }

    // Check if another city with the same name exists in this state
    const { data: duplicateCity } = await supabaseAdmin
      .from('cities')
      .select('id')
      .eq('name', name)
      .eq('state_id', state_id)
      .neq('id', id)
      .single();

    if (duplicateCity) {
      return NextResponse.json(
        { error: 'City with this name already exists in this state' },
        { status: 409 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('cities')
      .update({ name, state_id })
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

// DELETE - Delete a city
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Check if city exists
    const { data: existingCity } = await supabaseAdmin
      .from('cities')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingCity) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 });
    }

    // Check if city has areas
    const { data: areas } = await supabaseAdmin
      .from('areas')
      .select('id')
      .eq('city_id', id)
      .limit(1);

    if (areas && areas.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete city with existing areas' },
        { status: 409 }
      );
    }

    const { error } = await supabaseAdmin.from('cities').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'City deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
