'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import './route-progress.css';

type State = 'idle' | 'loading' | 'done' | 'hide';

const GIVE_UP_MS = 10000;
const DONE_MS = 200;
const HIDE_MS = 300;

function isPageLink(e: MouseEvent): boolean {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const link = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
  if (!link || link.hasAttribute('download')) return false;
  if (link.target && link.target !== '_self') return false;
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  return url.pathname !== window.location.pathname || url.search !== window.location.search;
}

export default function RouteProgress() {
  const pathname = usePathname();
  const params = useSearchParams();
  const [state, setState] = useState<State>('idle');
  const pending = useRef(false);
  const giveUp = useRef(0);
  const route = `${pathname}?${params?.toString() ?? ''}`;
  const lastRoute = useRef(route);

  useEffect(() => {
    const finish = () => {
      pending.current = false;
      window.clearTimeout(giveUp.current);
      setState((s) => (s === 'loading' ? 'done' : s));
    };
    const onClick = (e: MouseEvent) => {
      if (!isPageLink(e)) return;
      pending.current = true;
      window.clearTimeout(giveUp.current);
      setState('idle');
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (pending.current) setState('loading');
        }),
      );
      giveUp.current = window.setTimeout(finish, GIVE_UP_MS);
    };
    window.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('click', onClick);
      window.clearTimeout(giveUp.current);
    };
  }, []);

  useEffect(() => {
    if (route === lastRoute.current) return;
    lastRoute.current = route;
    const wasPending = pending.current;
    pending.current = false;
    window.clearTimeout(giveUp.current);
    setState((s) => (wasPending || s === 'loading' ? 'done' : s));
  }, [route]);

  useEffect(() => {
    if (state === 'done') {
      const t = window.setTimeout(() => setState('hide'), DONE_MS);
      return () => window.clearTimeout(t);
    }
    if (state === 'hide') {
      const t = window.setTimeout(() => setState('idle'), HIDE_MS);
      return () => window.clearTimeout(t);
    }
  }, [state]);

  return <div className='desert-ember route-progress' data-state={state} aria-hidden='true' />;
}
