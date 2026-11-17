'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRoles } from '@/hooks/use-roles';
import { AccessGuard } from './AccessGuard';
import { DashboardLoader } from './DashboardLoader';

export function DashboardSession({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading } = useUserRoles();
  const hadLoading = useRef(false);

  useEffect(() => {
    if (loading) hadLoading.current = true;
  }, [loading]);

  useEffect(() => {
    if (!hadLoading.current || loading || user !== null) return;
    router.replace('/auth/login');
  }, [loading, user, router]);

  if (loading || user === null) return <DashboardLoader />;
  return <AccessGuard>{children}</AccessGuard>;
}
