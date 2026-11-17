'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './ta-rail.css';

/* Horizontal card row (Tripadvisor's): a native scroll-snap track, four
   cards a view (three for `wide`), round arrows sitting on the row's edges
   at the middle of the photos. Each arrow only shows while there is more to
   scroll that way. Phones swipe; the arrows are hidden there. */

export default function Rail({ children, label, wide = false }: { children: ReactNode; label: string; wide?: boolean }) {
  const ref = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [update]);

  // cards arrive after the data loads
  useEffect(update, [children, update]);

  const step = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth, behavior: 'smooth' });

  return (
    <div className={'ta-rail' + (wide ? ' ta-rail--wide' : '')}>
      <ul className="ta-rail__track" ref={ref} aria-label={label}>
        {children}
      </ul>
      {!edges.start && (
        <button type="button" className="ta-rail__arrow ta-rail__arrow--prev" onClick={() => step(-1)} aria-label="Previous">
          <ChevronLeft aria-hidden="true" />
        </button>
      )}
      {!edges.end && (
        <button type="button" className="ta-rail__arrow ta-rail__arrow--next" onClick={() => step(1)} aria-label="Next">
          <ChevronRight aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
