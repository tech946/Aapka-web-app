'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function ConditionalHeader() {
  const pathname = usePathname();

  // Hide header on dashboard routes and maintenance page
  const isDashboardRoute = pathname?.startsWith('/dashboard');
  const isMaintenancePage = pathname === '/';

  if (isDashboardRoute || isMaintenancePage) {
    return null;
  }

  return <Header />;
}
