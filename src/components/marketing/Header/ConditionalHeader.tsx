'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function ConditionalHeader() {
  const pathname = usePathname();

  // Hide header on dashboard and auth routes
  const isDashboardRoute = pathname?.startsWith('/dashboard');
  const isAuthRoute = pathname?.startsWith('/auth');

  if (isDashboardRoute || isAuthRoute) {
    return null;
  }

  return <Header />;
}
