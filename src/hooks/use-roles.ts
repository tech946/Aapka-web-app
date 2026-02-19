'use client';

import { useEffect, useState } from 'react';
import type { UserWithRoles } from '@/types/roles';
import { useUserStore } from '@/store/user-store';

export function useUserRoles() {
  const { user, loading, setUser, setLoading, shouldRefetch, clearUser } = useUserStore();

  useEffect(() => {
    let mounted = true;

    const fetchUserRoles = async () => {
      if (!shouldRefetch() && user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await fetch('/api/user/roles', {
          method: 'GET',
          credentials: 'include',
        });

        if (!mounted) return;

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 401) {
            clearUser();
            setLoading(false);
            return;
          }
          throw new Error(errorData.error || 'Failed to fetch user roles');
        }

        const data = await response.json();

        if (mounted && data.user) {
          setUser(data.user);
        } else if (mounted) {
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchUserRoles();

    return () => {
      mounted = false;
    };
  }, [user, shouldRefetch, setUser, setLoading, clearUser]);

  return { user, loading, error: null };
}

export function useHasRoleId(roleId: number) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, loading: userLoading } = useUserRoles();

  useEffect(() => {
    if (userLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    const userRoleIds: number[] = [];

    if (user.primary_role?.role_id) {
      userRoleIds.push(user.primary_role.role_id);
    }

    if (user.roles && Array.isArray(user.roles)) {
      user.roles.forEach((r) => {
        if (r.role_id && r.is_active && !userRoleIds.includes(r.role_id)) {
          userRoleIds.push(r.role_id);
        }
      });
    }

    setHasAccess(userRoleIds.includes(roleId));
    setLoading(false);
  }, [user, userLoading, roleId]);

  return { hasAccess, loading };
}
