// Role-based access for web app (Super Admin, Content Editor)
// Uses same Supabase tables as CRM: roles, user_roles, profiles

import { supabaseAdmin } from './supabase-admin';
import type { UserWithRoles, UserRole, Role } from '@/types/roles';

export async function getUserRoles(userId: string): Promise<UserRole[]> {
  const { data, error } = await supabaseAdmin
    .from('user_roles')
    .select(`*, role:roles(*)`)
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }

  const roles = (data || []) as UserRole[];

  // Fallback: if no user_roles, check profiles.role_id (for first admin or legacy users)
  if (roles.length === 0) {
    try {
      const { data: profile, error: profileErr } = await supabaseAdmin
        .from('profiles')
        .select('role_id, role_name')
        .eq('id', userId)
        .maybeSingle();

      if (!profileErr && profile?.role_id) {
        const { data: roleData } = await supabaseAdmin
          .from('roles')
          .select('*')
          .eq('id', profile.role_id)
          .single();

        if (roleData) {
          roles.push({
            id: `profile-${userId}`,
            user_id: userId,
            role_id: profile.role_id,
            is_primary: true,
            assigned_at: new Date().toISOString(),
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            role: roleData as Role,
          } as UserRole);
        }
      }
    } catch {
      // profiles may not have role_id column yet
    }
  }

  return roles;
}

export async function getUserWithRoles(userId: string): Promise<UserWithRoles | null> {
  const roles = await getUserRoles(userId);
  const primaryRole = roles.find((r) => r.is_primary) || roles[0] || null;

  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
    userId
  );

  if (userError || !userData?.user) {
    return null;
  }

  return {
    id: userData.user.id,
    email: userData.user.email || '',
    user_metadata: userData.user.user_metadata,
    roles,
    primary_role: primaryRole || undefined,
    permissions: [],
  };
}

export async function hasRoleId(userId: string, roleId: number): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.some((ur) => ur.role_id === roleId && ur.is_active);
}

export async function assignRole(
  userId: string,
  roleId: number,
  subRoleId?: number,
  assignedBy?: string,
  isPrimary = true
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: roleData } = await supabaseAdmin
      .from('roles')
      .select('id, name, display_name')
      .eq('id', roleId)
      .single();

    if (!roleData) {
      return { success: false, error: 'Role not found' };
    }

    if (isPrimary) {
      await supabaseAdmin
        .from('user_roles')
        .update({ is_primary: false })
        .eq('user_id', userId);
    }

    const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
      user_id: userId,
      role_id: roleId,
      sub_role_id: subRoleId || null,
      is_primary: isPrimary,
      assigned_by: assignedBy || null,
      is_active: true,
    });

    if (roleError) {
      return { success: false, error: roleError.message };
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        role_id: roleId,
        role_name: roleData.name,
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Error updating profile:', profileError);
    }

    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getWebAppRoles(): Promise<Role[]> {
  const { data, error } = await supabaseAdmin
    .from('roles')
    .select('*')
    .in('id', [1, 2]) // Super Admin, Content Editor only
    .eq('is_active', true)
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching roles:', error);
    return [];
  }

  return (data || []) as Role[];
}
