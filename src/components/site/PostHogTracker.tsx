'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { afterLoad } from '@/lib/after-load';
import { isWebsitePath } from '@/lib/posthog-paths';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

let client: Promise<typeof import('@/lib/posthog-client')> | null = null;

const loadClient = () => (client ??= import('@/lib/posthog-client'));

const LOCAL_HOST = /^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|0\.0\.0\.0|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$|\.(local|localhost|test)$/;

const isProduction = () =>
  process.env.NODE_ENV === 'production' &&
  (!process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV === 'production') &&
  !LOCAL_HOST.test(window.location.hostname);

export default function PostHogTracker() {
  const pathname = usePathname() ?? '/';
  const onWebsite = isWebsitePath(pathname);

  useEffect(() => {
    if (!POSTHOG_KEY || !isProduction()) return;

    if (!onWebsite) {
      void client?.then((m) => m.pausePostHog()).catch(() => {});
      return;
    }

    return afterLoad(() => {
      void loadClient()
        .then((m) => {
          m.startPostHog(POSTHOG_KEY, POSTHOG_HOST);
          m.resumePostHog();
        })
        .catch(() => {});
    });
  }, [onWebsite]);

  return null;
}
