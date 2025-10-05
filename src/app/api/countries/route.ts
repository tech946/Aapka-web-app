import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Get all countries with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

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

    // Get total count for pagination metadata
    const { count, error: countError } = await supabaseAdmin
      .from('countries')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    // Get paginated data
    const { data, error } = await supabaseAdmin
      .from('countries')
      .select('*')
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

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

// POST - Create a new country
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    let name, image_url;

    if (contentType?.includes('multipart/form-data')) {
      // Handle form data with file upload
      const formData = await request.formData();
      name = formData.get('name') as string;
      const file = formData.get('file') as File;

      if (!name) {
        return NextResponse.json(
          { error: 'Name is required' },
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
            .from('country-images')
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
          .from('country-images')
          .getPublicUrl(fileName);

        image_url = urlData.publicUrl;
      }
    } else {
      // Handle JSON data
      const body = await request.json();
      name = body.name;
      image_url = body.image_url;
    }

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if country already exists
    const { data: existingCountry } = await supabaseAdmin
      .from('countries')
      .select('id')
      .eq('name', name)
      .single();

    if (existingCountry) {
      return NextResponse.json(
        { error: 'Country already exists' },
        { status: 409 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('countries')
      .insert([{ name, image_url: image_url || null }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Create country error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update a country
export async function PUT(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    let id, name, image_url, old_image_url;

    if (contentType?.includes('multipart/form-data')) {
      // Handle form data with file upload
      const formData = await request.formData();
      id = formData.get('id') as string;
      name = formData.get('name') as string;
      old_image_url = formData.get('old_image_url') as string;
      const file = formData.get('file') as File;

      if (!id || !name) {
        return NextResponse.json(
          { error: 'ID and name are required' },
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

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } =
          await supabaseAdmin.storage
            .from('country-images')
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
          .from('country-images')
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
      image_url = body.image_url;
      old_image_url = body.old_image_url;
    }

    if (!id || !name) {
      return NextResponse.json(
        { error: 'ID and name are required' },
        { status: 400 }
      );
    }

    // Check if country exists
    const { data: existingCountry } = await supabaseAdmin
      .from('countries')
      .select('id, image_url')
      .eq('id', id)
      .single();

    if (!existingCountry) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 });
    }

    // Check if another country with the same name exists
    const { data: duplicateCountry } = await supabaseAdmin
      .from('countries')
      .select('id')
      .eq('name', name)
      .neq('id', id)
      .single();

    if (duplicateCountry) {
      return NextResponse.json(
        { error: 'Country with this name already exists' },
        { status: 409 }
      );
    }

    // If image changed, delete old image from storage
    if (
      old_image_url &&
      old_image_url !== image_url &&
      existingCountry.image_url
    ) {
      try {
        const oldImagePath = existingCountry.image_url.split('/').pop();
        if (oldImagePath) {
          await supabaseAdmin.storage
            .from('country-images')
            .remove([oldImagePath]);
        }
      } catch (error) {
        console.error('Error deleting old image:', error);
        // Continue with update even if image deletion fails
      }
    }

    const { data, error } = await supabaseAdmin
      .from('countries')
      .update({ name, image_url: image_url || null })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Update country error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a country
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Check if country exists and get image URL
    const { data: existingCountry } = await supabaseAdmin
      .from('countries')
      .select('id, image_url')
      .eq('id', id)
      .single();

    if (!existingCountry) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 });
    }

    // Check if country has states
    const { data: states } = await supabaseAdmin
      .from('states')
      .select('id')
      .eq('country_id', id)
      .limit(1);

    if (states && states.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete country with existing states' },
        { status: 409 }
      );
    }

    // Delete associated image from storage if exists
    if (existingCountry.image_url) {
      try {
        const imagePath = existingCountry.image_url.split('/').pop();
        if (imagePath) {
          await supabaseAdmin.storage
            .from('country-images')
            .remove([imagePath]);
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        // Continue with deletion even if image deletion fails
      }
    }

    const { error } = await supabaseAdmin
      .from('countries')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Country deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
