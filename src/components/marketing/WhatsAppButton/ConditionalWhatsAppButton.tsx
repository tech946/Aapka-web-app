'use client';

import { usePathname } from 'next/navigation';
import WhatsAppButton from './WhatsAppButton';

export default function ConditionalWhatsAppButton() {
  const pathname = usePathname();

  // Hide WhatsApp button on dashboard routes and maintenance page
  const isDashboardRoute = pathname?.startsWith('/dashboard');
  const isMaintenancePage = pathname === '/';

  if (isDashboardRoute || isMaintenancePage) {
    return null;
  }

  return <WhatsAppButton />;
}
