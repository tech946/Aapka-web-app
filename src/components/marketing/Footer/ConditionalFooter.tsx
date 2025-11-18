'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();

  // Hide footer on dashboard routes
  const isDashboardRoute = pathname?.startsWith('/dashboard');

  if (isDashboardRoute) {
    return null;
  }

  return <Footer />;
}
