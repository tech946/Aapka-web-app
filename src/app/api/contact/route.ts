import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ContactQuery {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message?: string;
}

// POST - Create new contact query
export async function POST(req: NextRequest) {
  try {
    const body: ContactQuery = await req.json();

    const { firstName, lastName, email, phone, message } = body;

    // Validation
    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Insert contact query
    const { data, error } = await supabaseAdmin
      .from('contact_queries')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        message: message || null,
        status: 'new',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to submit query', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Unexpected error occurred' },
      { status: 500 }
    );
  }
}

// GET - Fetch contact queries with pagination and search
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const offset = (page - 1) * limit;

    // Build query
    let query = supabaseAdmin
      .from('contact_queries')
      .select('*', { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination and ordering
    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch queries', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Unexpected error occurred' },
      { status: 500 }
    );
  }
}
