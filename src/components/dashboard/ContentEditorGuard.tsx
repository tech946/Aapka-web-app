'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useHasRoleId } from '@/hooks/use-roles';
import { RoleId } from '@/types/roles';

/**
 * Role-based route protection:
 * - Super Admin: full access to all dashboard routes
 * - Content Editor & others: only blog-management; redirect to blog-management for other routes
 */
export function ContentEditorGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasAccess: isSuperAdmin, loading } = useHasRoleId(RoleId.SUPER_ADMIN);

  useEffect(() => {
    if (loading) return;

    // Super Admin can access everything
    if (isSuperAdmin) return;

    // Non-Super-Admin (Content Editor, no roles, etc.): only blog-management
    const isBlogRoute = pathname.startsWith('/dashboard/blog-management');
    if (!isBlogRoute && pathname.startsWith('/dashboard')) {
      router.replace('/dashboard/blog-management');
    }
  }, [pathname, isSuperAdmin, loading, router]);

  return <>{children}</>;
}
