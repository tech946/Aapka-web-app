'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAccess } from '@/hooks/use-access';
import { DashboardLoader } from './DashboardLoader';

export function AccessGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const router = useRouter();
  const { loading, canVisit, landingPath } = useAccess();
  const allowed = canVisit(pathname);

  useEffect(() => {
    if (!loading && !allowed) router.replace(landingPath);
  }, [loading, allowed, landingPath, router]);

  if (loading || !allowed) return <DashboardLoader />;
  return <>{children}</>;
}
