import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Get all properties with pagination and search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination parameters
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit') || '10';
    const searchParam = searchParams.get('search') || '';
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

    // Build query with search
    let query = supabaseAdmin.from('properties').select(
      `
        *,
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
        property_types (
          id,
          name,
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
      `,
      { count: 'exact' }
    );

    // Add search filter if provided
    if (searchParam) {
      query = query.or(
        `project_name.ilike.%${searchParam}%,payment_plan.ilike.%${searchParam}%,handover.ilike.%${searchParam}%`
      );
    }

    // Get total count and data
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
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

// POST - Create new property
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');

    if (contentType?.includes('multipart/form-data')) {
      // Handle brochure upload
      const formData = await request.formData();
      const project_name = formData.get('project_name') as string;
      const property_status_id = formData.get('property_status_id') as string;
      const country_id = formData.get('country_id') as string;
      const state_id = formData.get('state_id') as string;
      const city_id = formData.get('city_id') as string;
      const area_id = formData.get('area_id') as string;
      const starting_price = formData.get('starting_price') as string;
      const property_type_id = formData.get('property_type_id') as string;
      const payment_plan = formData.get('payment_plan') as string;
      const handover = formData.get('handover') as string;
      const expected_appreciation = formData.get(
        'expected_appreciation'
      ) as string;
      const amenities = formData.get('amenities') as string; // JSON string
      const brochureFile = formData.get('brochure_file') as File;

      if (!project_name) {
        return NextResponse.json(
          { error: 'Project name is required' },
          { status: 400 }
        );
      }

      // Validate brochure file if provided
      if (brochureFile && brochureFile.size > 0) {
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (!allowedTypes.includes(brochureFile.type)) {
          return NextResponse.json(
            {
              error:
                'Invalid file type. Only PDF and Word documents are allowed.',
            },
            { status: 400 }
          );
        }

        if (brochureFile.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { error: 'File size too large. Maximum 10MB allowed.' },
            { status: 400 }
          );
        }
      }

      let brochureUrl = null;

      // Upload brochure if provided
      if (brochureFile && brochureFile.size > 0) {
        const fileExt = brochureFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `property-brochures/${fileName}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from('property-brochures')
          .upload(filePath, brochureFile);

        if (uploadError) {
          return NextResponse.json(
            { error: `Failed to upload brochure: ${uploadError.message}` },
            { status: 500 }
          );
        }

        const {
          data: { publicUrl },
        } = supabaseAdmin.storage
          .from('property-brochures')
          .getPublicUrl(filePath);

        brochureUrl = publicUrl;
      }

      // Create property
      const { data: property, error: propertyError } = await supabaseAdmin
        .from('properties')
        .insert([
          {
            project_name,
            property_status_id: property_status_id || null,
            country_id: country_id || null,
            state_id: state_id || null,
            city_id: city_id || null,
            area_id: area_id || null,
            starting_price: starting_price ? parseFloat(starting_price) : null,
            property_type_id: property_type_id
              ? parseInt(property_type_id)
              : null,
            payment_plan: payment_plan || null,
            handover: handover || null,
            expected_appreciation: expected_appreciation || null,
            brochure_url: brochureUrl,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (propertyError) {
        return NextResponse.json(
          { error: propertyError.message },
          { status: 500 }
        );
      }

      // Handle amenities if provided
      if (amenities) {
        try {
          const amenityIds = JSON.parse(amenities);
          if (Array.isArray(amenityIds) && amenityIds.length > 0) {
            const amenityInserts = amenityIds.map((amenityId: string) => ({
              property_id: property.id,
              amenity_id: amenityId,
            }));

            const { error: amenityError } = await supabaseAdmin
              .from('property_amenities')
              .insert(amenityInserts);

            if (amenityError) {
              console.error('Error inserting amenities:', amenityError);
            }
          }
        } catch (parseError) {
          console.error('Error parsing amenities:', parseError);
        }
      }

      // Fetch the complete property with all relationships
      const { data: completeProperty, error: fetchError } = await supabaseAdmin
        .from('properties')
        .select(
          `
          *,
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
          property_types (
            id,
            name,
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
        .eq('id', property.id)
        .single();

      if (fetchError) {
        return NextResponse.json(
          { error: fetchError.message },
          { status: 500 }
        );
      }

      return NextResponse.json(completeProperty, { status: 201 });
    } else {
      // Handle JSON data without brochure
      const body = await request.json();
      const {
        project_name,
        property_status_id,
        country_id,
        state_id,
        city_id,
        area_id,
        starting_price,
        property_type_id,
        payment_plan,
        handover,
        expected_appreciation,
        amenities,
      } = body;

      if (!project_name) {
        return NextResponse.json(
          { error: 'Project name is required' },
          { status: 400 }
        );
      }

      const { data: property, error: propertyError } = await supabaseAdmin
        .from('properties')
        .insert([
          {
            project_name,
            property_status_id: property_status_id || null,
            country_id: country_id || null,
            state_id: state_id || null,
            city_id: city_id || null,
            area_id: area_id || null,
            starting_price: starting_price ? parseFloat(starting_price) : null,
            property_type_id: property_type_id
              ? parseInt(property_type_id)
              : null,
            payment_plan: payment_plan || null,
            handover: handover || null,
            expected_appreciation: expected_appreciation || null,
            brochure_url: null,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (propertyError) {
        return NextResponse.json(
          { error: propertyError.message },
          { status: 500 }
        );
      }

      // Handle amenities if provided
      if (amenities && Array.isArray(amenities) && amenities.length > 0) {
        const amenityInserts = amenities.map((amenityId: string) => ({
          property_id: property.id,
          amenity_id: amenityId,
        }));

        const { error: amenityError } = await supabaseAdmin
          .from('property_amenities')
          .insert(amenityInserts);

        if (amenityError) {
          console.error('Error inserting amenities:', amenityError);
        }
      }

      return NextResponse.json(property, { status: 201 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update property
export async function PUT(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');

    if (contentType?.includes('multipart/form-data')) {
      // Handle brochure upload
      const formData = await request.formData();
      const id = formData.get('id') as string;
      const project_name = formData.get('project_name') as string;
      const property_status_id = formData.get('property_status_id') as string;
      const country_id = formData.get('country_id') as string;
      const state_id = formData.get('state_id') as string;
      const city_id = formData.get('city_id') as string;
      const area_id = formData.get('area_id') as string;
      const starting_price = formData.get('starting_price') as string;
      const property_type_id = formData.get('property_type_id') as string;
      const payment_plan = formData.get('payment_plan') as string;
      const handover = formData.get('handover') as string;
      const expected_appreciation = formData.get(
        'expected_appreciation'
      ) as string;
      const amenities = formData.get('amenities') as string; // JSON string
      const brochureFile = formData.get('brochure_file') as File;
      const existingBrochureUrl = formData.get(
        'existing_brochure_url'
      ) as string;

      if (!id || !project_name) {
        return NextResponse.json(
          { error: 'ID and project name are required' },
          { status: 400 }
        );
      }

      // Get existing property to check current brochure
      const { data: existingProperty, error: fetchError } = await supabaseAdmin
        .from('properties')
        .select('id, brochure_url')
        .eq('id', id)
        .single();

      if (fetchError) {
        return NextResponse.json(
          { error: fetchError.message },
          { status: 500 }
        );
      }

      let brochureUrl = existingBrochureUrl || existingProperty.brochure_url;

      // Handle brochure upload if new file provided
      if (brochureFile && brochureFile.size > 0) {
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (!allowedTypes.includes(brochureFile.type)) {
          return NextResponse.json(
            {
              error:
                'Invalid file type. Only PDF and Word documents are allowed.',
            },
            { status: 400 }
          );
        }

        if (brochureFile.size > 10 * 1024 * 1024) {
          return NextResponse.json(
            { error: 'File size too large. Maximum 10MB allowed.' },
            { status: 400 }
          );
        }

        // Delete old brochure if exists
        if (existingProperty.brochure_url) {
          const oldBrochurePath = existingProperty.brochure_url
            .split('/')
            .pop();
          if (oldBrochurePath) {
            await supabaseAdmin.storage
              .from('property-brochures')
              .remove([`property-brochures/${oldBrochurePath}`]);
          }
        }

        // Upload new brochure
        const fileExt = brochureFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `property-brochures/${fileName}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from('property-brochures')
          .upload(filePath, brochureFile);

        if (uploadError) {
          return NextResponse.json(
            { error: `Failed to upload brochure: ${uploadError.message}` },
            { status: 500 }
          );
        }

        const {
          data: { publicUrl },
        } = supabaseAdmin.storage
          .from('property-brochures')
          .getPublicUrl(filePath);

        brochureUrl = publicUrl;
      }

      // Update property
      const { data: property, error: propertyError } = await supabaseAdmin
        .from('properties')
        .update({
          project_name,
          property_status_id: property_status_id || null,
          country_id: country_id || null,
          state_id: state_id || null,
          city_id: city_id || null,
          area_id: area_id || null,
          starting_price: starting_price ? parseFloat(starting_price) : null,
          property_type_id: property_type_id || null,
          payment_plan: payment_plan || null,
          handover: handover || null,
          expected_appreciation: expected_appreciation || null,
          brochure_url: brochureUrl,
        })
        .eq('id', id)
        .select()
        .single();

      if (propertyError) {
        return NextResponse.json(
          { error: propertyError.message },
          { status: 500 }
        );
      }

      // Update amenities
      if (amenities) {
        try {
          // Delete existing amenities
          await supabaseAdmin
            .from('property_amenities')
            .delete()
            .eq('property_id', id);

          // Insert new amenities
          const amenityIds = JSON.parse(amenities);
          if (Array.isArray(amenityIds) && amenityIds.length > 0) {
            const amenityInserts = amenityIds.map((amenityId: string) => ({
              property_id: id,
              amenity_id: amenityId,
            }));

            const { error: amenityError } = await supabaseAdmin
              .from('property_amenities')
              .insert(amenityInserts);

            if (amenityError) {
              console.error('Error updating amenities:', amenityError);
            }
          }
        } catch (parseError) {
          console.error('Error parsing amenities:', parseError);
        }
      }

      // Fetch the complete property with all relationships
      const { data: completeProperty, error: fetchCompleteError } =
        await supabaseAdmin
          .from('properties')
          .select(
            `
          *,
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
          property_types (
            id,
            name,
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
          .eq('id', id)
          .single();

      if (fetchCompleteError) {
        return NextResponse.json(
          { error: fetchCompleteError.message },
          { status: 500 }
        );
      }

      return NextResponse.json(completeProperty);
    } else {
      // Handle JSON data without brochure
      const body = await request.json();
      const {
        id,
        project_name,
        property_status_id,
        country_id,
        state_id,
        city_id,
        area_id,
        starting_price,
        property_type_id,
        payment_plan,
        handover,
        expected_appreciation,
        amenities,
      } = body;

      if (!id || !project_name) {
        return NextResponse.json(
          { error: 'ID and project name are required' },
          { status: 400 }
        );
      }

      const { data: property, error: propertyError } = await supabaseAdmin
        .from('properties')
        .update({
          project_name,
          property_status_id: property_status_id || null,
          country_id: country_id || null,
          state_id: state_id || null,
          city_id: city_id || null,
          area_id: area_id || null,
          starting_price: starting_price ? parseFloat(starting_price) : null,
          property_type_id: property_type_id || null,
          payment_plan: payment_plan || null,
          handover: handover || null,
          expected_appreciation: expected_appreciation || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (propertyError) {
        return NextResponse.json(
          { error: propertyError.message },
          { status: 500 }
        );
      }

      // Update amenities
      if (amenities && Array.isArray(amenities)) {
        // Delete existing amenities
        await supabaseAdmin
          .from('property_amenities')
          .delete()
          .eq('property_id', id);

        // Insert new amenities
        if (amenities.length > 0) {
          const amenityInserts = amenities.map((amenityId: string) => ({
            property_id: id,
            amenity_id: amenityId,
          }));

          const { error: amenityError } = await supabaseAdmin
            .from('property_amenities')
            .insert(amenityInserts);

          if (amenityError) {
            console.error('Error updating amenities:', amenityError);
          }
        }
      }

      return NextResponse.json(property);
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete property
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Get property to check for brochure
    const { data: property, error: fetchError } = await supabaseAdmin
      .from('properties')
      .select('brochure_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Delete brochure if exists
    if (property.brochure_url) {
      const brochurePath = property.brochure_url.split('/').pop();
      if (brochurePath) {
        await supabaseAdmin.storage
          .from('property-brochures')
          .remove([`property-brochures/${brochurePath}`]);
      }
    }

    // Delete property (cascade will handle property_amenities)
    const { error } = await supabaseAdmin
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Property deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
