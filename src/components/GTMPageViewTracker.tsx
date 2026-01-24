'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    dataLayer: any[];
  }
}

export default function GTMPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      try {
        const searchString = searchParams?.toString() || '';
        const fullPath = pathname + (searchString ? `?${searchString}` : '');
        
        window.dataLayer.push({
          event: 'page_view',
          page_path: fullPath,
          page_title: document.title || '',
          page_location: window.location.href,
        });
      } catch (error) {
        // Silently handle any errors during tracking
        console.warn('GTM tracking error:', error);
      }
    }
  }, [pathname, searchParams]);

  return null;
}
