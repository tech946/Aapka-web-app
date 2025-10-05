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
    const body = await request.json();
    const { name, city_id } = body;

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
      .insert([{ name, city_id }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update an area
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, city_id } = body;

    if (!id || !name || !city_id) {
      return NextResponse.json(
        { error: 'ID, name, and city_id are required' },
        { status: 400 }
      );
    }

    // Check if area exists
    const { data: existingArea } = await supabaseAdmin
      .from('areas')
      .select('id')
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

    const { data, error } = await supabaseAdmin
      .from('areas')
      .update({ name, city_id })
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

// DELETE - Delete an area
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Check if area exists
    const { data: existingArea } = await supabaseAdmin
      .from('areas')
      .select('id')
      .eq('id', id)
      .single();

    if (!existingArea) {
      return NextResponse.json({ error: 'Area not found' }, { status: 404 });
    }

    const { error } = await supabaseAdmin.from('areas').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Area deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
