import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Get all unit types with pagination and search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

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
      .from('unit_types')
      .select('*', { count: 'exact', head: true });

    // Add search filter if search term is provided
    if (search) {
      countQuery = countQuery.ilike('name', `%${search}%`);
    }

    // Get total count for pagination metadata
    const { count, error: countError } = await countQuery;

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    // Build query for data
    let query = supabaseAdmin
      .from('unit_types')
      .select('*')
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    // Add search filter if search term is provided
    if (search) {
      query = query.ilike('name', `%${search}%`);
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

// POST - Create a new unit type
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    let name, description, image_url;

    if (contentType?.includes('multipart/form-data')) {
      // Handle form data with file upload
      const formData = await request.formData();
      name = formData.get('name') as string;
      description = formData.get('description') as string;
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
        const fileName = `unit_type_${Date.now()}.${fileExt}`;

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } =
          await supabaseAdmin.storage
            .from('unit-type-images')
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
          .from('unit-type-images')
          .getPublicUrl(fileName);

        image_url = urlData.publicUrl;
      }
    } else {
      // Handle JSON data
      const body = await request.json();
      name = body.name;
      description = body.description;
      image_url = body.image_url;
    }

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Check if unit type already exists
    const { data: existingUnitType } = await supabaseAdmin
      .from('unit_types')
      .select('id')
      .eq('name', name)
      .single();

    if (existingUnitType) {
      return NextResponse.json(
        { error: 'Unit type with this name already exists' },
        { status: 409 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('unit_types')
      .insert([
        {
          name,
          description: description || null,
          image_url: image_url || null,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Create unit type error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update a unit type
export async function PUT(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    let id, name, description, image_url, old_image_url, remove_image;

    if (contentType?.includes('multipart/form-data')) {
      // Handle form data with file upload
      const formData = await request.formData();
      id = formData.get('id') as string;
      name = formData.get('name') as string;
      description = formData.get('description') as string;
      old_image_url = formData.get('old_image_url') as string;
      remove_image = formData.get('remove_image') as string;
      const file = formData.get('file') as File;

      if (!id || !name) {
        return NextResponse.json(
          { error: 'ID and name are required' },
          { status: 400 }
        );
      }

      // Handle image removal
      if (remove_image === 'true' && old_image_url) {
        try {
          const oldFileName = old_image_url.split('/').pop();
          if (oldFileName) {
            await supabaseAdmin.storage
              .from('unit-type-images')
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
                .from('unit-type-images')
                .remove([oldFileName]);
            }
          } catch (error) {
            console.error('Error deleting old image:', error);
          }
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `unit_type_${Date.now()}.${fileExt}`;

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } =
          await supabaseAdmin.storage
            .from('unit-type-images')
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
          .from('unit-type-images')
          .getPublicUrl(fileName);

        image_url = urlData.publicUrl;
      }
    } else {
      // Handle JSON data
      const body = await request.json();
      id = body.id;
      name = body.name;
      description = body.description;
      image_url = body.image_url;
      old_image_url = body.old_image_url;
    }

    if (!id || !name) {
      return NextResponse.json(
        { error: 'ID and name are required' },
        { status: 400 }
      );
    }

    // Check if unit type exists
    const { data: existingUnitType } = await supabaseAdmin
      .from('unit_types')
      .select('id, image_url')
      .eq('id', id)
      .single();

    if (!existingUnitType) {
      return NextResponse.json(
        { error: 'Unit type not found' },
        { status: 404 }
      );
    }

    // Check if another unit type with the same name exists
    const { data: duplicateUnitType } = await supabaseAdmin
      .from('unit_types')
      .select('id')
      .eq('name', name)
      .neq('id', id)
      .single();

    if (duplicateUnitType) {
      return NextResponse.json(
        { error: 'Unit type with this name already exists' },
        { status: 409 }
      );
    }

    // Prepare update data
    const updateData: any = {
      name,
      description: description || null,
    };

    // Only update image_url if it was explicitly set (including null for removal)
    if (image_url !== undefined) {
      updateData.image_url = image_url;
    }

    const { data, error } = await supabaseAdmin
      .from('unit_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Update unit type error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a unit type
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Check if unit type exists and get its image URL
    const { data: existingUnitType } = await supabaseAdmin
      .from('unit_types')
      .select('id, image_url')
      .eq('id', id)
      .single();

    if (!existingUnitType) {
      return NextResponse.json(
        { error: 'Unit type not found' },
        { status: 404 }
      );
    }

    // Delete the image from storage if it exists
    if (existingUnitType.image_url) {
      try {
        const fileName = existingUnitType.image_url.split('/').pop();
        if (fileName) {
          await supabaseAdmin.storage
            .from('unit-type-images')
            .remove([fileName]);
        }
      } catch (error) {
        console.error('Error deleting unit type image:', error);
        // Continue with unit type deletion even if image deletion fails
      }
    }

    const { error } = await supabaseAdmin
      .from('unit_types')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Unit type deleted successfully' });
  } catch (error) {
    console.error('Delete unit type error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
