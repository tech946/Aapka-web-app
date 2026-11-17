'use client';

import { useEffect, useRef } from 'react';

type Props = {
  src: string;
  className: string;
  base: number;
  rate: number;
  anchor: number;
  min?: number;
  max?: number;
  track?: 'parent' | 'section';
};

export default function FrEarth({ src, className, base, rate, anchor, min = -Infinity, max = Infinity, track = 'parent' }: Props) {
  const img = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const el = img.current;
    const box = track === 'section' ? el?.closest('section') : el?.parentElement;
    if (!el || !box || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const angle = base + (anchor - box.getBoundingClientRect().top) * rate;
      el.style.transform = `rotate(${Math.min(max, Math.max(min, angle))}deg)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, [base, rate, anchor, min, max, track]);

  return <img ref={img} src={src} alt="" className={className} />;
}
