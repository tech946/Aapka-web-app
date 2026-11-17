'use client';

import { useCallback, useMemo } from 'react';
import { useUserRoles } from '@/hooks/use-roles';
import {
  PERMISSIONS,
  canAccessPath,
  getRole,
  hasPermission,
  landingPathFor,
  resolvePermissions,
  type Permission,
} from '@/lib/access';

export function useAccess() {
  const { user, loading } = useUserRoles();

  const roleIds = useMemo(() => {
    const ids = (user?.roles ?? []).filter((r) => r.is_active !== false).map((r) => Number(r.role_id));
    if (user?.primary_role?.role_id) ids.push(Number(user.primary_role.role_id));
    return [...new Set(ids)];
  }, [user]);

  const permissions = useMemo(() => resolvePermissions(roleIds), [roleIds]);

  const can = useCallback((permission: Permission) => hasPermission(permissions, permission), [permissions]);
  const canVisit = useCallback((pathname: string) => canAccessPath(permissions, pathname), [permissions]);

  const primaryRoleId = user?.primary_role?.role_id ?? roleIds[0];

  return {
    user,
    loading,
    roleIds,
    permissions,
    can,
    canVisit,
    isSuperAdmin: hasPermission(permissions, PERMISSIONS.ALL),
    landingPath: landingPathFor(permissions),
    roleLabel: getRole(primaryRoleId)?.label ?? user?.primary_role?.role?.display_name ?? 'Dashboard user',
  };
}
