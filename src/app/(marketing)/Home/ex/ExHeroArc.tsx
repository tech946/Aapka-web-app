'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export type ArcCard = { key: string; label: string; meta?: string; href: string; small: string; large: string; video?: string };

const SPEED = 36;
const INTRO_SPEED = SPEED * 6;
const RADIUS = 0.65;
const DEPTH = 1;
const GAP = 0.035;
const MAX_FLING = 3200;

export default function ExHeroArc({ cards }: { cards: ArcCard[] }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef({ offset: 0, velocity: 0, speed: INTRO_SPEED });
  const [copies, setCopies] = useState(1);
  const count = cards.length;

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !count) return;
    const items = Array.from(stage.querySelectorAll<HTMLElement>('.ex-arc__card'));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const videos = items.map((el) => el.querySelector('video'));
    const shown: (boolean | null)[] = items.map(() => null);
    const m = motionRef.current;
    if (reduce.matches) m.speed = 0;
    let width = 0;
    let cardW = 0;
    let step = 0;
    let span = 0;
    let radius = 1;
    let depth = 1;
    let hovered = false;
    let focused = false;
    let visible = true;
    let raf = 0;
    let last = 0;
    let suppressClick = false;
    let drag: { id: number; x: number; lastX: number; lastT: number; moved: boolean } | null = null;

    const measure = () => {
      width = stage.clientWidth;
      cardW = items[0]?.offsetWidth ?? 0;
      step = cardW * (1 + GAP);
      span = step * items.length;
      radius = Math.max(width * RADIUS, cardW * 4.5);
      depth = radius * DEPTH;
      stage.style.perspective = depth + 'px';
      if (!step) return;
      const need = Math.max(1, Math.ceil((width * 1.4 + step * 3) / (step * count)));
      if (need > copies) setCopies(need);
    };

    const paint = () => {
      if (!span) return;
      const half = span / 2;
      const edge = width / 2 + cardW;
      for (let i = 0; i < items.length; i++) {
        const el = items[i];
        const pos = ((((i * step - m.offset) % span) + span) % span) - half;
        const angle = pos / radius;
        const z = radius * (1 - Math.cos(angle));
        const x = (radius * Math.sin(angle) * depth) / (depth - z);
        const show = Math.abs(angle) <= 1.2 && z <= depth * 0.7 && Math.abs(x) <= edge;
        if (show !== shown[i]) {
          shown[i] = show;
          el.style.visibility = show ? 'visible' : 'hidden';
          const video = videos[i];
          if (video) {
            if (show && !reduce.matches) video.play().catch(() => {});
            else video.pause();
          }
        }
        if (!show) continue;
        el.style.zIndex = String(Math.round(z));
        el.style.transform = `translateZ(${radius}px) rotateY(${-angle}rad) translateZ(${-radius}px)`;
      }
    };

    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
      last = t;
      if (!drag) {
        const target = hovered || focused || reduce.matches ? 0 : SPEED;
        m.speed += (target - m.speed) * Math.min(1, dt * 3);
        m.velocity *= Math.exp(-dt * 2.6);
        if (Math.abs(m.velocity) < 1) m.velocity = 0;
        m.offset += (m.speed + m.velocity) * dt;
      }
      paint();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (raf || !visible) return;
      last = 0;
      raf = requestAnimationFrame(tick);
    };

    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      videos.forEach((v) => v?.pause());
      shown.fill(null);
    };

    const endDrag = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.moved) {
        suppressClick = true;
        delete stage.dataset.dragging;
        if (stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);
      }
      if (e.timeStamp - drag.lastT > 120) m.velocity = 0;
      drag = null;
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      suppressClick = false;
      m.velocity = 0;
      drag = { id: e.pointerId, x: e.clientX, lastX: e.clientX, lastT: e.timeStamp, moved: false };
    };

    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moved) {
        if (Math.abs(e.clientX - drag.x) < 6) return;
        drag.moved = true;
        m.speed = 0;
        stage.dataset.dragging = '';
        stage.setPointerCapture(e.pointerId);
      }
      const dx = e.clientX - drag.lastX;
      const dtm = Math.max(1, e.timeStamp - drag.lastT);
      const v = Math.max(-MAX_FLING, Math.min(MAX_FLING, (-dx / dtm) * 1000));
      m.velocity = m.velocity * 0.5 + v * 0.5;
      m.offset -= dx;
      drag.lastX = e.clientX;
      drag.lastT = e.timeStamp;
    };

    const onClick = (e: MouseEvent) => {
      if (!suppressClick) return;
      suppressClick = false;
      e.preventDefault();
      e.stopPropagation();
    };

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      m.offset += e.deltaX;
    };

    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') hovered = true;
    };
    const onLeave = () => {
      hovered = false;
    };
    const onFocusIn = () => {
      focused = true;
    };
    const onFocusOut = (e: FocusEvent) => {
      if (!stage.contains(e.relatedTarget as Node | null)) focused = false;
    };

    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);
    stage.addEventListener('pointerenter', onEnter);
    stage.addEventListener('pointerleave', onLeave);
    stage.addEventListener('focusin', onFocusIn);
    stage.addEventListener('focusout', onFocusOut);
    stage.addEventListener('click', onClick, true);
    stage.addEventListener('wheel', onWheel, { passive: false });

    const resize = new ResizeObserver(() => {
      measure();
      paint();
    });
    resize.observe(stage);

    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    seen.observe(stage);

    measure();
    paint();
    stage.dataset.ready = '';
    start();

    return () => {
      stop();
      resize.disconnect();
      seen.disconnect();
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointermove', onMove);
      stage.removeEventListener('pointerup', endDrag);
      stage.removeEventListener('pointercancel', endDrag);
      stage.removeEventListener('pointerenter', onEnter);
      stage.removeEventListener('pointerleave', onLeave);
      stage.removeEventListener('focusin', onFocusIn);
      stage.removeEventListener('focusout', onFocusOut);
      stage.removeEventListener('click', onClick, true);
      stage.removeEventListener('wheel', onWheel);
    };
  }, [copies, count]);

  return (
    <div className="ex-arc">
      <div ref={stageRef} className="ex-arc__stage" role="region" aria-roledescription="carousel" aria-label="Popular experiences">
        {Array.from({ length: copies }, (_, c) =>
          cards.map((card, i) => {
            const clone = c > 0;
            return (
              <Link
                key={c + '-' + card.key}
                href={card.href}
                className="ex-arc__card"
                draggable={false}
                aria-hidden={clone || undefined}
                tabIndex={clone ? -1 : undefined}
              >
                {card.video ? (
                  <video className="ex-arc__media" src={card.video} poster={card.large} muted loop playsInline preload="metadata" aria-hidden="true" />
                ) : (
                  <img
                    className="ex-arc__media"
                    src={card.large}
                    srcSet={`${card.small} 400w, ${card.large} 720w`}
                    sizes="(max-width: 767px) 200px, 340px"
                    alt=""
                    draggable={false}
                    decoding="async"
                  />
                )}
                <span className="ex-arc__info">
                  <b>{card.label}</b>
                  {card.meta ? <small>{card.meta}</small> : null}
                </span>
              </Link>
            );
          }),
        )}
      </div>
    </div>
  );
}
