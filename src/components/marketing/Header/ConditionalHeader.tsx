'use client';

import { usePathname } from 'next/navigation';
import { showSiteHeader } from '@/components/site/chrome-routes';
import NavyHeader from './NavyHeader';
import '@/components/site/styles/theme.css';
import '@/components/site/styles/site.css';
import '@/components/site/ta/ta-chrome.css';

export default function ConditionalHeader() {
  const pathname = usePathname() || '/';
  if (!showSiteHeader(pathname)) return null;

  return <NavyHeader />;
}
