import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

/**
 * GET - Get user bank details (MOBILE APP - TOKEN AUTHENTICATED)
 * This endpoint returns the current user's bank details from the account_details column
 * in the profiles table
 *
 * Required headers:
 * - Authorization: Bearer <access_token>
 */
export async function GET(request: NextRequest) {
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

    // Get user profile with account details from the profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select(
        'id, full_name, email_address, account_details, created_at, updated_at'
      )
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found. Please contact support.' },
        { status: 404 }
      );
    }

    // Extract bank details from account_details column
    const bankDetails = profile.account_details || {};

    // Return bank details in a clean structure
    return NextResponse.json({
      success: true,
      id: profile.id,
      full_name: profile.full_name,
      email_address: profile.email_address,
      bank_details: bankDetails,
      has_bank_details: !!bankDetails && Object.keys(bankDetails).length > 0,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    });
  } catch (error) {
    console.error('Error in GET /api/mobile/bank-details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
