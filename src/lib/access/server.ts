import 'server-only';
import { cache } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getUserRoles } from '@/lib/roles';
import { resolvePermissions } from './roles';
import { hasPermission, type Permission } from './permissions';

export interface AccessUser {
  id: string;
  email: string;
  roleIds: number[];
  permissions: Permission[];
}

export const getAccessUser = cache(async (): Promise<AccessUser | null> => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const roles = await getUserRoles(user.id);
  const roleIds = [...new Set(roles.map((r) => Number(r.role_id)))];
  return {
    id: user.id,
    email: user.email ?? '',
    roleIds,
    permissions: resolvePermissions(roleIds),
  };
});

export async function userCan(permission: Permission): Promise<boolean> {
  const user = await getAccessUser();
  return !!user && hasPermission(user.permissions, permission);
}
