import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, userData } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData?.fullName || '',
          avatar_url: userData?.avatarUrl || '',
          phone: userData?.phone || '',
          // Add any additional user metadata
        },
        // Optional: Configure email confirmation
        emailRedirectTo: undefined, // Mobile apps don't need web redirects
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Check if email confirmation is required
    if (data.user && !data.session) {
      return NextResponse.json(
        {
          message: 'Confirmation email sent. Please check your inbox.',
          user: data.user,
          requiresEmailConfirmation: true,
        },
        { status: 200 }
      );
    }

    // If auto-confirm is enabled, return session
    return NextResponse.json(
      {
        access_token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        expires_in: data.session?.expires_in,
        expires_at: data.session?.expires_at,
        user: data.user,
        requiresEmailConfirmation: false,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
