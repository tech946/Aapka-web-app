import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

/**
 * POST - Add a new lead (MOBILE APP - TOKEN AUTHENTICATED)
 * This endpoint allows mobile users to add leads using Bearer token authentication
 *
 * Required headers:
 * - Authorization: Bearer <access_token>
 *
 * Request body:
 * - fullname: string (required)
 * - mobile_no: string (required)
 * - email: string (required)
 * - relationship: string (required)
 * - budget: number (required)
 * - purpose_of_buying: string (required)
 * - buying_timeline: string (required)
 * - notes: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
    // Extract Authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized. Please provide a valid access token.' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client to verify the token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verify the token and get the user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired access token. Please login again.' },
        { status: 401 }
      );
    }

    // Verify user exists in profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found. Please contact support.' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    const {
      fullname,
      mobile_no,
      email,
      relationship,
      budget,
      purpose_of_buying,
      buying_timeline,
      notes,
    } = body;

    // All fields are required except notes
    if (
      !fullname ||
      !mobile_no ||
      !email ||
      !relationship ||
      !budget ||
      !purpose_of_buying ||
      !buying_timeline
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields. Required: fullname, mobile_no, email, relationship, budget, purpose_of_buying, buying_timeline',
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Create lead data
    const leadData = {
      fullname,
      mobile_no,
      email,
      relationship,
      budget: parseFloat(budget),
      purpose_of_buying,
      buying_timeline,
      notes: notes || null,
      status: 'new', // Default status for new leads
      created_by: user.id, // Associate with authenticated user
    };

    // Insert lead using admin client to bypass RLS
    const { data: lead, error } = await supabaseAdmin
      .from('leads')
      .insert([leadData])
      .select()
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      return NextResponse.json(
        { error: 'Failed to create lead', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Lead created successfully',
        lead,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/mobile/leads/add:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
