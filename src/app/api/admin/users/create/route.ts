// Create users (Super Admin only) - Web app: no groups, roles 1 or 2 only

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { assignRole, hasRoleId } from '@/lib/roles';
import { RoleId } from '@/types/roles';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isSuperAdmin = await hasRoleId(session.user.id, RoleId.SUPER_ADMIN);
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Only Super Admin can create users' },
        { status: 403 }
      );
    }

    const { email, roleId, fullName, phone, password } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    if (!roleId) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 });
    }

    // Only allow Content Editor (2) - Super Admin (1) cannot be created
    if (roleId === RoleId.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'Super Admin cannot be created through this interface' },
        { status: 403 }
      );
    }

    if (roleId !== RoleId.CONTENT_EDITOR) {
      return NextResponse.json(
        { error: 'Invalid role. Only Content Editor can be created.' },
        { status: 400 }
      );
    }

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id, name, display_name')
      .eq('id', roleId)
      .eq('is_active', true)
      .single();

    if (roleError || !roleData) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || '',
        phone: phone || '',
        role_id: roleId,
        role_name: roleData.name,
      },
    });

    if (authError || !authData.user) {
      let errorMessage = authError?.message || 'Failed to create user';
      if (
        authError?.message?.includes('already registered') ||
        authError?.message?.includes('already exists')
      ) {
        errorMessage = 'An account with this email already exists';
      }
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const createdUser = authData.user;

    // Upsert profile (no groups in web app)
    await supabaseAdmin.from('profiles').upsert(
      {
        id: createdUser.id,
        email_address: email,
        full_name: fullName || '',
        phone: phone || '',
        role_id: roleId,
        role_name: roleData.name,
      },
      { onConflict: 'id' }
    );

    await assignRole(createdUser.id, roleId, undefined, session.user.id, true);

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully. They can now login with the provided credentials.',
        user: {
          id: createdUser.id,
          email: createdUser.email,
          role_id: roleId,
          role_name: roleData.name,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
