'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type TouchEvent } from 'react';

/**
 * React version of the redesign's `.tc-slider` engine (apkatourism-new-design
 * lib/home-ui.ts). Same breakpoints, gap and autoplay behaviour, but driven by
 * state so slides that arrive after a fetch are laid out too.
 *
 * Slide widths are CSS percentages of the track, so the first paint (server
 * render included) is already the final layout — nothing is measured.
 *
 *   const s = useTcSlider({ count: items.length, perView: 6, gap: 16 });
 *   <div className="tc-slider" {...s.rootProps}>
 *     <div className="tc-slider-track" style={s.trackStyle} {...s.trackProps}>
 *       {items.map((it, i) => <div className="tc-slide" style={s.slideStyle(i)} />)}
 */

interface Options {
  count: number;
  /** slides per view on desktop (data-per-view in the design markup) */
  perView?: number;
  /** px between slides (data-gap) */
  gap?: number;
  /** ms between automatic advances; 0 = off (data-autoplay) */
  autoplay?: number;
}

/** Same breakpoint table as the design's Slider.prototype.perView. */
function perViewFor(base: number, w: number): number {
  if (base === 1) return 1;
  if (w < 576) return base >= 4 ? 1.6 : 1.15;
  if (w < 768) return base >= 4 ? 2.4 : base > 1 ? 1.6 : 1;
  if (w < 992) return Math.min(base, 3);
  if (w < 1200) return Math.min(base, base >= 6 ? 5 : 4);
  return base;
}

export function useTcSlider({ count, perView = 1, gap = 0, autoplay = 0 }: Options) {
  const [width, setWidth] = useState<number | null>(null);
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const sync = () => setWidth(window.innerWidth);
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  // until the window is known (server render) use the desktop count
  const per = width == null ? perView : perViewFor(perView, width);
  const maxIndex = Math.max(0, Math.ceil(count - per));
  const current = Math.min(index, maxIndex);
  const single = count <= 1;
  const auto = single ? 0 : autoplay;

  const go = useCallback((i: number) => setIndex(Math.max(0, Math.min(i, maxIndex))), [maxIndex]);
  const prev = useCallback(() => go(current - 1), [go, current]);
  const next = useCallback(() => {
    // autoplaying sliders wrap back to the start, manual ones stop at the end
    go(current >= maxIndex ? (auto ? 0 : maxIndex) : current + 1);
  }, [go, current, maxIndex, auto]);

  useEffect(() => {
    if (!auto || hovered) return;
    const t = setInterval(next, auto);
    return () => clearInterval(t);
  }, [auto, hovered, next]);

  const gaps = (Math.ceil(per) - 1) * gap;
  const slideWidth = `calc((100% - ${gaps}px) / ${per})`;

  const trackStyle: CSSProperties = {
    transform: `translate3d(calc(${-current} * (${slideWidth} + ${gap}px)), 0, 0)`,
  };

  function slideStyle(i: number): CSSProperties {
    return { width: slideWidth, marginRight: i === count - 1 ? 0 : gap };
  }

  const rootProps = auto
    ? { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) }
    : {};

  const trackProps = {
    onTouchStart: (e: TouchEvent) => {
      touchX.current = e.touches[0].clientX;
      setHovered(true);
    },
    onTouchEnd: (e: TouchEvent) => {
      if (touchX.current == null) return;
      const dx = e.changedTouches[0].clientX - touchX.current;
      touchX.current = null;
      setHovered(false);
      if (Math.abs(dx) > 40) go(current + (dx < 0 ? 1 : -1));
    },
  };

  return {
    index: current,
    maxIndex,
    /** one slide (or none): hide arrows and dots, like the design does */
    single,
    canPrev: current > 0,
    canNext: current < maxIndex,
    prev,
    next,
    go,
    rootProps,
    trackProps,
    trackStyle,
    slideStyle,
  };
}
