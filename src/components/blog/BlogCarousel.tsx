'use client';

import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface BlogCarouselProps {
  children: ReactNode;
  label: string;
  className?: string;
  autoPlayMs?: number;
  dots?: boolean;
}

export function BlogCarousel({ children, label, className = '', autoPlayMs, dots = false }: BlogCarouselProps) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = Children.count(children);
  const multiple = count > 1;

  const goTo = useCallback(
    (next: number) => {
      const el = track.current;
      if (!el) return;
      const target = (next + count) % count;
      el.scrollTo({ left: target * el.clientWidth, behavior: 'smooth' });
    },
    [count],
  );

  const onScroll = () => {
    const el = track.current;
    if (el && el.clientWidth) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  useEffect(() => {
    if (!autoPlayMs || !multiple || paused) return;
    const id = window.setInterval(() => goTo(index + 1), autoPlayMs);
    return () => window.clearInterval(id);
  }, [autoPlayMs, multiple, paused, index, goTo]);

  return (
    <div
      className={`bl-carousel ${className}`}
      role='region'
      aria-roledescription='carousel'
      aria-label={label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className='bl-carousel__track' ref={track} onScroll={onScroll}>
        {Children.map(children, (child, i) => (
          <div className='bl-carousel__slide' role='group' aria-roledescription='slide' aria-label={`${i + 1} of ${count}`}>
            {child}
          </div>
        ))}
      </div>

      {multiple && (
        <>
          <button type='button' className='bl-carousel__arrow bl-carousel__arrow--prev' onClick={() => goTo(index - 1)} aria-label='Previous'>
            <ArrowLeft size={18} aria-hidden />
          </button>
          <button type='button' className='bl-carousel__arrow bl-carousel__arrow--next' onClick={() => goTo(index + 1)} aria-label='Next'>
            <ArrowRight size={18} aria-hidden />
          </button>
        </>
      )}

      {multiple && dots && (
        <div className='bl-carousel__dots'>
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type='button'
              className={i === index ? 'is-active' : ''}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
