'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import type Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { afterLoad } from '@/lib/after-load';

const SKIP = ['/dashboard', '/auth', '/influencer', '/agent'];

function scrollLocked(): boolean {
  return (
    getComputedStyle(document.documentElement).overflow === 'hidden' ||
    getComputedStyle(document.body).overflow === 'hidden'
  );
}

export default function SmoothScroll() {
  const pathname = usePathname() || '/';
  const enabled = !SKIP.some((p) => pathname.startsWith(p));
  const active = useRef<Lenis | null>(null);

  useEffect(() => {
    active.current?.scrollTo(window.scrollY, { immediate: true, force: true });
  }, [pathname]);

  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let lenis: Lenis | null = null;
    let observer: MutationObserver | null = null;
    let cancelled = false;

    const stopWaiting = afterLoad(() => {
      import('lenis').then(({ default: LenisClass }) => {
        if (cancelled) return;
        const instance = new LenisClass({ lerp: 0.09, wheelMultiplier: 0.9, autoRaf: true, allowNestedScroll: true });
        lenis = instance;
        active.current = instance;
        const sync = () => {
          const locked = scrollLocked();
          if (locked && !instance.isStopped) instance.stop();
          else if (!locked && instance.isStopped) instance.start();
        };
        observer = new MutationObserver(sync);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
        observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class'] });
        sync();
      });
    });

    return () => {
      cancelled = true;
      stopWaiting();
      observer?.disconnect();
      lenis?.destroy();
      active.current = null;
    };
  }, [enabled]);

  return null;
}
