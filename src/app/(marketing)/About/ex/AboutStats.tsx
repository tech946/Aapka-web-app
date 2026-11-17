'use client';

import { useEffect, useRef } from 'react';

const STATS = [
  { value: 12, suffix: '+', label: 'Years in Dubai' },
  { value: 10000, suffix: '+', label: 'Happy travellers' },
  { value: 2, suffix: '', label: 'Offices in Dubai & Delhi' },
  { value: 280, suffix: 'K+', label: 'Followers on Instagram' },
];

const DURATION = 1400;

function format(n: number) {
  return n.toLocaleString('en-IN');
}

export default function AboutStats() {
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const el = list.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const nums = Array.from(el.querySelectorAll<HTMLElement>('[data-to]'));
    let frame = 0;

    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION);
        const eased = 1 - Math.pow(1 - t, 3);
        nums.forEach((n) => {
          n.textContent = format(Math.round(Number(n.dataset.to) * eased));
        });
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        run();
      },
      { threshold: 0.5 }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section className="ab-stats" aria-label="Aapka Tourism in numbers">
      <div className="ex-wrap">
        <ul className="ab-stats__card" ref={list}>
          {STATS.map((s) => (
            <li key={s.label} className="ab-stats__item">
              <p className="ab-stats__value">
                <span data-to={s.value}>{format(s.value)}</span>
                {s.suffix ? <em>{s.suffix}</em> : null}
              </p>
              <p className="ab-stats__label">{s.label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
