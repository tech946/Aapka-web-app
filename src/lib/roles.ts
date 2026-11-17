import { supabaseAdmin } from './supabase-admin';
import { resolvePermissions } from './access/roles';
import type { UserWithRoles, UserRole, Role } from '@/types/roles';

async function roleFromProfile(userId: string): Promise<UserRole | null> {
  try {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('role_id')
      .eq('id', userId)
      .maybeSingle();
    if (error || !profile?.role_id) return null;

    const { data: role } = await supabaseAdmin.from('roles').select('*').eq('id', profile.role_id).single();
    if (!role) return null;

    const now = new Date().toISOString();
    return {
      id: `profile-${userId}`,
      user_id: userId,
      role_id: profile.role_id,
      is_primary: true,
      assigned_at: now,
      is_active: true,
      created_at: now,
      updated_at: now,
      role: role as Role,
    };
  } catch {
    return null;
  }
}

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
  if (roles.length > 0) return roles;

  const fallback = await roleFromProfile(userId);
  return fallback ? [fallback] : [];
}

export async function getUserWithRoles(userId: string): Promise<UserWithRoles | null> {
  const roles = await getUserRoles(userId);
  const primaryRole = roles.find((r) => r.is_primary) || roles[0] || null;

  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (userError || !userData?.user) return null;

  return {
    id: userData.user.id,
    email: userData.user.email || '',
    user_metadata: userData.user.user_metadata,
    roles,
    primary_role: primaryRole || undefined,
    permissions: resolvePermissions(roles.map((r) => Number(r.role_id))),
  };
}

export async function hasRoleId(userId: string, roleId: number): Promise<boolean> {
  const roles = await getUserRoles(userId);
  const targetId = Number(roleId);
  return roles.some((ur) => Number(ur.role_id) === targetId && ur.is_active !== false);
}
