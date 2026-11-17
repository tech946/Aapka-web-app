'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

type Kind = 'fade' | 'rise' | 'slide';

const TARGETS: [string, Kind][] = [
  ['.ex-pop__head, .ex-band__head, .ex-band__cta, .ex-bnr, .ex-faq__head, .ex-faq__list, .ex-faq__all, .ex-st__head, .ex-st__cta, .ex-pop__dots', 'fade'],
  ['.ex-why__grid, .ex-cat__grid', 'rise'],
  ['.ex-pop__rail, .ex-rail, .ex-tm__rail, .ex-st__rail', 'slide'],
];

const EASE = 'power2.out';
const CLEAR = 'opacity,visibility,transform,transition,willChange';

function play(el: HTMLElement, kind: Kind) {
  el.dataset.rvIn = '';

  if (kind === 'fade') {
    gsap.to(el, { autoAlpha: 1, y: 0, duration: 1.2, ease: EASE, clearProps: CLEAR });
    const dashes = el.querySelectorAll('.ex-pop__dash');
    if (dashes.length) gsap.from(dashes, { scaleX: 0, duration: 0.9, delay: 0.4, ease: EASE, clearProps: 'transform' });
    return;
  }

  const items = Array.from(el.children).slice(0, 8);
  gsap.set(items, { transition: 'none', willChange: 'transform, opacity' });
  gsap.set(el, { clearProps: 'opacity,visibility' });
  gsap.from(items, {
    autoAlpha: 0,
    x: kind === 'slide' ? 40 : 0,
    y: kind === 'rise' ? 40 : 0,
    duration: 1.2,
    ease: EASE,
    stagger: 0.14,
    clearProps: CLEAR,
  });
}

export default function ExMotion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>('.ex main');
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const seen = new WeakSet<Element>();
    const ctx = gsap.context(() => {}, root);

    const scan = () => {
      ctx.add(() => {
        for (const [selector, kind] of TARGETS) {
          root.querySelectorAll<HTMLElement>(selector).forEach((el) => {
            if (seen.has(el)) return;
            seen.add(el);
            if (el.getBoundingClientRect().top < window.innerHeight) return;
            if (kind === 'fade') gsap.set(el, { autoAlpha: 0, y: 36, transition: 'none', willChange: 'transform, opacity' });
            else gsap.set(el, { autoAlpha: 0 });
            ScrollTrigger.create({
              trigger: el,
              start: kind === 'fade' ? 'top 92%' : 'top 85%',
              once: true,
              onEnter: () => play(el, kind),
            });
          });
        }
      });
    };

    let scanTimer = 0;
    const scheduleScan = () => {
      window.clearTimeout(scanTimer);
      scanTimer = window.setTimeout(scan, 200);
    };

    let refreshTimer = 0;
    let lastHeight = root.offsetHeight;
    const ro = new ResizeObserver(() => {
      const height = root.offsetHeight;
      if (Math.abs(height - lastHeight) < 4) return;
      lastHeight = height;
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 300);
    });

    scan();
    const mo = new MutationObserver(scheduleScan);
    mo.observe(root, { childList: true, subtree: true });
    ro.observe(root);

    return () => {
      window.clearTimeout(scanTimer);
      window.clearTimeout(refreshTimer);
      mo.disconnect();
      ro.disconnect();
      ctx.revert();
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return null;
}
