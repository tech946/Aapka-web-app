import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Get all property statuses with pagination
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
      .from('property_status')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    // Get paginated data
    const { data, error } = await supabaseAdmin
      .from('property_status')
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

// POST - Create new property status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, color, is_active } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Validate color format if provided
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return NextResponse.json(
        { error: 'Invalid color format. Use hex color code (e.g., #FF0000)' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('property_status')
      .insert([
        {
          name,
          description: description || null,
          color: color || null,
          is_active: is_active !== undefined ? is_active : true,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update property status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, color, is_active } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: 'ID and name are required' },
        { status: 400 }
      );
    }

    // Validate color format if provided
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return NextResponse.json(
        { error: 'Invalid color format. Use hex color code (e.g., #FF0000)' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('property_status')
      .update({
        name,
        description: description || null,
        color: color || null,
        is_active: is_active !== undefined ? is_active : true,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete property status
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Delete property status
    const { error } = await supabaseAdmin
      .from('property_status')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Property status deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
