import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Get all amenities with pagination
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
      .from('amenities')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    // Get paginated data
    const { data, error } = await supabaseAdmin
      .from('amenities')
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

// POST - Create new amenity
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');

    if (contentType?.includes('multipart/form-data')) {
      // Handle image upload
      const formData = await request.formData();
      const name = formData.get('name') as string;
      const description = formData.get('description') as string;
      const imageFile = formData.get('image_file') as File;

      if (!name) {
        return NextResponse.json(
          { error: 'Name is required' },
          { status: 400 }
        );
      }

      // Validate image file if provided
      if (imageFile && imageFile.size > 0) {
        const allowedTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
        ];
        if (!allowedTypes.includes(imageFile.type)) {
          return NextResponse.json(
            {
              error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
            },
            { status: 400 }
          );
        }

        if (imageFile.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { error: 'File size too large. Maximum 5MB allowed.' },
            { status: 400 }
          );
        }
      }

      let imageUrl = null;

      // Upload image if provided
      if (imageFile && imageFile.size > 0) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `amenity-images/${fileName}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from('amenity-images')
          .upload(filePath, imageFile);

        if (uploadError) {
          return NextResponse.json(
            { error: `Failed to upload image: ${uploadError.message}` },
            { status: 500 }
          );
        }

        const {
          data: { publicUrl },
        } = supabaseAdmin.storage.from('amenity-images').getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      // Create amenity with image
      const { data, error } = await supabaseAdmin
        .from('amenities')
        .insert([
          {
            name,
            description: description || null,
            image_url: imageUrl,
          },
        ])
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data, { status: 201 });
    } else {
      // Handle JSON data without image
      const body = await request.json();
      const { name, description } = body;

      if (!name) {
        return NextResponse.json(
          { error: 'Name is required' },
          { status: 400 }
        );
      }

      const { data, error } = await supabaseAdmin
        .from('amenities')
        .insert([
          {
            name,
            description: description || null,
            image_url: null,
          },
        ])
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update amenity
export async function PUT(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');

    if (contentType?.includes('multipart/form-data')) {
      // Handle image upload
      const formData = await request.formData();
      const id = formData.get('id') as string;
      const name = formData.get('name') as string;
      const description = formData.get('description') as string;
      const imageFile = formData.get('image_file') as File;
      const existingImageUrl = formData.get('existing_image_url') as string;

      if (!id || !name) {
        return NextResponse.json(
          { error: 'ID and name are required' },
          { status: 400 }
        );
      }

      // Get existing amenity to check current image
      const { data: existingAmenity, error: fetchError } = await supabaseAdmin
        .from('amenities')
        .select('id, image_url')
        .eq('id', id)
        .single();

      if (fetchError) {
        return NextResponse.json(
          { error: fetchError.message },
          { status: 500 }
        );
      }

      let imageUrl = existingImageUrl || existingAmenity.image_url;

      // Handle image upload if new file provided
      if (imageFile && imageFile.size > 0) {
        const allowedTypes = [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/webp',
        ];
        if (!allowedTypes.includes(imageFile.type)) {
          return NextResponse.json(
            {
              error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
            },
            { status: 400 }
          );
        }

        if (imageFile.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { error: 'File size too large. Maximum 5MB allowed.' },
            { status: 400 }
          );
        }

        // Delete old image if exists
        if (existingAmenity.image_url) {
          const oldImagePath = existingAmenity.image_url.split('/').pop();
          if (oldImagePath) {
            await supabaseAdmin.storage
              .from('amenity-images')
              .remove([`amenity-images/${oldImagePath}`]);
          }
        }

        // Upload new image
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `amenity-images/${fileName}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from('amenity-images')
          .upload(filePath, imageFile);

        if (uploadError) {
          return NextResponse.json(
            { error: `Failed to upload image: ${uploadError.message}` },
            { status: 500 }
          );
        }

        const {
          data: { publicUrl },
        } = supabaseAdmin.storage.from('amenity-images').getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      // Update amenity
      const { data, error } = await supabaseAdmin
        .from('amenities')
        .update({
          name,
          description: description || null,
          image_url: imageUrl,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    } else {
      // Handle JSON data without image
      const body = await request.json();
      const { id, name, description } = body;

      if (!id || !name) {
        return NextResponse.json(
          { error: 'ID and name are required' },
          { status: 400 }
        );
      }

      const { data, error } = await supabaseAdmin
        .from('amenities')
        .update({
          name,
          description: description || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete amenity
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Get amenity to check for image
    const { data: amenity, error: fetchError } = await supabaseAdmin
      .from('amenities')
      .select('image_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Delete image if exists
    if (amenity.image_url) {
      const imagePath = amenity.image_url.split('/').pop();
      if (imagePath) {
        await supabaseAdmin.storage
          .from('amenity-images')
          .remove([`amenity-images/${imagePath}`]);
      }
    }

    // Delete amenity
    const { error } = await supabaseAdmin
      .from('amenities')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Amenity deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
