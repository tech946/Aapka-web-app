'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/* Start every new page at the top.
   Next.js only scrolls on navigation when the new page's first element is
   off screen — and the redesigned pages start with the `.at-site` wrapper,
   which is `display: contents` (no box), so its top always reads as 0 and
   Next leaves you wherever you were (e.g. at the footer). This resets the
   scroll on each pathname change, except:
     · the first render (a reload keeps the browser's own restore)
     · back / forward (the browser restores the old position)
     · links to a #section (the browser scrolls to it) */
export default function ScrollReset() {
  const pathname = usePathname();
  const first = useRef(true);
  const fromHistory = useRef(false);

  useEffect(() => {
    const onPop = () => {
      fromHistory.current = true;
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (fromHistory.current) {
      fromHistory.current = false;
      return;
    }
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
