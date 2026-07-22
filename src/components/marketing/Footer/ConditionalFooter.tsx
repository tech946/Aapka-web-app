'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();

  // Hide footer on dashboard and auth routes
  const isDashboardRoute = pathname?.startsWith('/dashboard');
  const isAuthRoute = pathname?.startsWith('/auth');

  if (isDashboardRoute || isAuthRoute) {
    return null;
  }

  return <Footer />;
}
