'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Camera, Check, ChevronDown, ChevronLeft, ChevronRight, Share2, Sparkles } from 'lucide-react';
import { plain } from '../../listing/listing-data';
import { CONTACT } from '../../site-config';
import type { ItineraryDay } from '../pdp-data';
import { titleCase } from '../pdp-data';
import type { RelatedItem } from '../PdpRelated';
import { VwLightbox } from '../vw/VwParts';

export function ExpGallery({ images, name, badge, onShare }: { images: string[]; name: string; badge: string; onShare: () => void }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const count = images.length;

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const closeLightbox = useCallback(() => setOpen(null), []);

  const go = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollTo({ left: (index + dir) * el.clientWidth, behavior: 'smooth' });
  };

  const start = Math.min(Math.max(0, index - 2), Math.max(0, count - 5));
  const dots = images.slice(start, start + 5).map((_, i) => start + i);

  return (
    <div className="exp-gallery">
      <div className="exp-gallery__track" ref={track}>
        {(count ? images : ['/images/package-1.png']).map((src, i) => (
          <button key={src + i} type="button" className="exp-gallery__slide" onClick={() => count && setOpen(i)} aria-label={`View photo ${i + 1} of ${name}`}>
            <img src={src} alt="" loading={i === 0 ? 'eager' : 'lazy'} />
          </button>
        ))}
      </div>
      <span className="exp-gallery__shade" aria-hidden="true" />
      <div className="exp-gallery__top">
        <span className="exp-badge">
          <Sparkles aria-hidden="true" />
          <span>
            <b>
              Aapka <em>{badge}</em>
            </b>
            <small>Planned by our Dubai team</small>
          </span>
        </span>
        <button type="button" className="exp-gallery__icon" onClick={onShare} aria-label="Share this holiday">
          <Share2 aria-hidden="true" />
        </button>
      </div>
      {count > 1 && (
        <>
          {index > 0 && (
            <button type="button" className="exp-gallery__arrow exp-gallery__arrow--prev" onClick={() => go(-1)} aria-label="Previous photo">
              <ChevronLeft aria-hidden="true" />
            </button>
          )}
          {index < count - 1 && (
            <button type="button" className="exp-gallery__arrow exp-gallery__arrow--next" onClick={() => go(1)} aria-label="Next photo">
              <ChevronRight aria-hidden="true" />
            </button>
          )}
          <span className="exp-gallery__dots" aria-hidden="true">
            {dots.map((i) => (
              <span key={i} className={'exp-gallery__dot' + (i === index ? ' is-active' : Math.abs(i - index) === 1 ? ' is-near' : '')} />
            ))}
          </span>
          <button type="button" className="exp-gallery__count" onClick={() => setOpen(0)} aria-label={`View all ${count} photos`}>
            <Camera aria-hidden="true" />
            {count}
          </button>
        </>
      )}
      {open !== null && <VwLightbox images={images} name={name} start={open} onClose={closeLightbox} />}
    </div>
  );
}

export function ExpPrice({ from, size = 'lg' }: { from?: { now: number | null; strike?: number | null; basis: string } | null; size?: 'lg' | 'sm' }) {
  if (!from || from.now == null) return <p className={'exp-price exp-price--' + size}>Price revealing soon</p>;
  const off = from.strike && from.strike > from.now ? Math.round((1 - from.now / from.strike) * 100) : 0;
  return (
    <div className={'exp-price exp-price--' + size}>
      <p className="exp-price__main">
        <b>From {money(from.now)}</b>
        <span>{from.basis.replace(/^starting price\s*/i, '') || 'per person'}</span>
      </p>
      {off > 0 && (
        <p className="exp-price__was">
          <s>{money(from.strike ?? 0)}</s>
          <b>{off}% off</b>
        </p>
      )}
    </div>
  );
}

function money(n: number): string {
  const v = Math.round(n * 100) / 100;
  return `AED ${v.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 })}`;
}

export function ExpExpert({ compact = false }: { compact?: boolean }) {
  return (
    <a href={CONTACT.uaePhoneHref} className={'exp-expert' + (compact ? ' exp-expert--compact' : '')}>
      <span className="exp-expert__avatar">
        <img src="/aapka-tourism-logo.png" alt="" />
      </span>
      <span className="exp-expert__text">
        <small>Book with an expert:</small>
        <b>{CONTACT.uaePhone}</b>
      </span>
    </a>
  );
}

export function ExpSection({ id, title, aside, children, className = '' }: { id: string; title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={'exp-sec ' + className} aria-labelledby={id + '-title'}>
      <div className="ex-wrap">
        <div className="exp-sec__head">
          <h2 id={id + '-title'} className="ex-h2">
            {title}
          </h2>
          {aside}
        </div>
        {children}
      </div>
    </section>
  );
}

export function ExpItinerary({ days, firstImage }: { days: ItineraryDay[]; firstImage?: string }) {
  const [open, setOpen] = useState<number[]>(days.length ? [days[0].day] : []);
  const [full, setFull] = useState<number[]>([]);
  const toggle = (day: number) => setOpen((cur) => (cur.includes(day) ? cur.filter((d) => d !== day) : [...cur, day]));

  return (
    <ol className="exp-days">
      {days.map((d, i) => {
        const isOpen = open.includes(d.day);
        const long = plain(d.html).length > 360;
        const expanded = full.includes(d.day);
        return (
          <li key={d.day + '-' + i} className={'exp-day' + (isOpen ? ' is-open' : '')}>
            <span className="exp-day__label">Day {d.day}</span>
            <span className="exp-day__rail" aria-hidden="true">
              <span className="exp-day__dot" />
            </span>
            <div className="exp-day__body">
              <button type="button" className="exp-day__head" aria-expanded={isOpen} onClick={() => toggle(d.day)}>
                <span className="exp-day__title">{titleCase(d.title)}</span>
                <ChevronDown aria-hidden="true" />
              </button>
              {isOpen && (
                <div className="exp-day__content">
                  {i === 0 && firstImage ? <img className="exp-day__img" src={firstImage} alt="" loading="lazy" /> : null}
                  <div className={'exp-rich' + (long && !expanded ? ' is-clamped' : '')} dangerouslySetInnerHTML={{ __html: d.html }} />
                  {long && (
                    <button type="button" className="exp-more" onClick={() => setFull((cur) => (expanded ? cur.filter((x) => x !== d.day) : [...cur, d.day]))}>
                      {expanded ? 'Read less' : 'Read more'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function htmlItems(html: string): Array<{ text: string; head: boolean }> {
  const rows = [...String(html ?? '').matchAll(/<(li|p|h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi)].map((m) => ({
    text: plain(m[2]),
    head: /^h/i.test(m[1]) || /^\s*<(strong|b)>[\s\S]*<\/\1>\s*$/i.test(m[2]),
  }));
  const items = rows.filter((r) => r.text);
  return items.length ? items : plain(html) ? [{ text: plain(html), head: false }] : [];
}

export function ExpChecklist({ items }: { items: Array<{ text: string; head: boolean }> }) {
  return (
    <ul className="exp-checks">
      {items.map((it, i) =>
        it.head ? (
          <li key={i} className="exp-checks__head">
            {it.text.replace(/:\s*$/, '')}
          </li>
        ) : (
          <li key={i}>
            <Check aria-hidden="true" />
            <span>{it.text}</span>
          </li>
        ),
      )}
    </ul>
  );
}

export function ExpAccordion({ items }: { items: Array<{ id: string; title: string; body: ReactNode }> }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  return (
    <div className="exp-acc">
      {items.map((it) => {
        const on = open === it.id;
        return (
          <div key={it.id} className={'exp-acc__item' + (on ? ' is-open' : '')}>
            <button type="button" className="exp-acc__head" aria-expanded={on} onClick={() => setOpen(on ? null : it.id)}>
              <h3>{it.title}</h3>
              <ChevronDown aria-hidden="true" />
            </button>
            {on && <div className="exp-acc__body">{it.body}</div>}
          </div>
        );
      })}
    </div>
  );
}

export function ExpRelated({ items, title, href }: { items: RelatedItem[]; title: string; href: string }) {
  const track = useRef<HTMLUListElement>(null);
  if (!items.length) return null;
  const step = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * 340 * 3, behavior: 'smooth' });

  return (
    <section className="exp-sec exp-related" aria-labelledby="exp-related-title">
      <div className="ex-wrap">
        <div className="exp-sec__head">
          <h2 id="exp-related-title" className="ex-h2">
            {title}
          </h2>
          <div className="ex-arrows">
            <button type="button" className="ex-arrow" onClick={() => step(-1)} aria-label="Previous">
              <ChevronLeft aria-hidden="true" />
            </button>
            <button type="button" className="ex-arrow" onClick={() => step(1)} aria-label="Next">
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
        </div>
        <ul className="ex-rail" ref={track}>
          {items.map((it) => (
            <li key={it.id} className="ex-card">
              <Link href={it.href} className="ex-card__link">
                <img className="ex-card__img" src={it.img || '/images/package-1.png'} alt="" loading="lazy" />
                <span className="ex-card__shade" aria-hidden="true" />
                <span className="ex-card__body">
                  <span className="ex-badge ex-badge--peach">
                    <Sparkles aria-hidden="true" />
                    <span>
                      Aapka <em>Pick</em>
                    </span>
                  </span>
                  <span className="ex-card__main">
                    <span className="ex-card__title">{titleCase(it.title)}</span>
                    {it.meta.length ? <span className="ex-card__sub">{it.meta.join(' · ').replace('Duration: ', '')}</span> : null}
                    <span className="ex-card__price">
                      <span className="ex-card__from">
                        <b>{it.price.replace(/^from /, 'From ')}</b>
                      </span>
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link href={href} className="ex-btn ex-btn--dark ex-band__cta">
          See all holidays
        </Link>
      </div>
    </section>
  );
}

export function ExpSticky({ show, from, tag, onBook }: { show: boolean; from?: { now: number | null; strike?: number | null; basis: string } | null; tag?: string | null; onBook: () => void }) {
  return (
    <div className={'exp-sticky' + (show ? ' is-shown' : '')} aria-hidden={!show}>
      <div className="exp-sticky__bar">
        <div className="exp-sticky__price">
          <ExpPrice from={from} size="sm" />
          {tag ? <span className="ex-tag exp-sticky__tag">{tag}</span> : null}
        </div>
        <div className="exp-sticky__actions">
          <button type="button" className="ex-btn ex-btn--dark" onClick={onBook} tabIndex={show ? 0 : -1}>
            See dates and prices
          </button>
          <ExpExpert compact />
        </div>
      </div>
    </div>
  );
}
