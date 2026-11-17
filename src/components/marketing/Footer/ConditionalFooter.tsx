'use client';

import { usePathname } from 'next/navigation';
import { showSiteFooter } from '@/components/site/chrome-routes';
import NavyFooter from './NavyFooter';

export default function ConditionalFooter() {
  const pathname = usePathname() || '/';
  if (!showSiteFooter(pathname)) return null;

  return <NavyFooter />;
}
