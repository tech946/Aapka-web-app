'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Compass,
  Info,
  ListChecks,
  MessageSquareQuote,
  Route,
  MapPin,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  X,
  type LucideIcon,
} from 'lucide-react';
import { plain, type ListingItem } from '../../listing/listing-data';
import { CONTACT } from '../../site-config';
import { REVIEWS } from '../../reviews';
import type { ItineraryDay } from '../pdp-data';
import { titleCase } from '../pdp-data';
import ExCard, { ExCardSkeleton } from '@/app/(marketing)/holidays/ex/ExCard';
import { responsiveImage } from '@/lib/image-url';
import { GALLERY_MAIN_MAX, GALLERY_MAIN_SIZES } from '../gallery-sizes';

export type From = { now: number | null; strike?: number | null; basis: string } | null | undefined;

export function money(n: number): string {
  const v = Math.round(n * 100) / 100;
  return `AED ${v.toLocaleString('en-US', { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 })}`;
}

export function whatsappHref(text?: string): string {
  return text ? `${CONTACT.whatsappHref}?text=${encodeURIComponent(text)}` : CONTACT.whatsappHref;
}

export function VwLightbox({
  images,
  name,
  onSeePrice,
  onClose,
}: {
  images: string[];
  name: string;
  start?: number;
  onSeePrice?: () => void;
  onClose: () => void;
}) {
  const [view, setView] = useState<number | null>(null);
  const count = images.length;
  const touch = useRef<number | null>(null);
  const step = useCallback((dir: number) => setView((v) => (v === null ? v : (v + dir + count) % count)), [count]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && view !== null) setView(null);
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [view, step]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="exp-lightbox" role="dialog" aria-modal="true" aria-label={`${name} photos`}>
      <div className="exp-lightbox__box">
        <div className="exp-lightbox__head">
          {view !== null && (
            <button type="button" className="exp-lightbox__back" onClick={() => setView(null)}>
              <ArrowLeft aria-hidden="true" />
              <span>All photos</span>
            </button>
          )}
          <p className="exp-lightbox__title">{name}</p>
          {view !== null && (
            <span className="exp-lightbox__count">
              {view + 1} / {count}
            </span>
          )}
          {onSeePrice && (
            <button type="button" className="exp-lightbox__cta" onClick={onSeePrice}>
              See price
            </button>
          )}
          <button type="button" className="exp-lightbox__close" onClick={onClose} aria-label="Close photos">
            <X aria-hidden="true" />
          </button>
        </div>
        {view === null ? (
          <div className="exp-lightbox__grid">
            {images.map((src, n) => (
              <button key={src + n} type="button" className="exp-lightbox__tile" onClick={() => setView(n)} aria-label={`Open photo ${n + 1}`}>
                <img {...responsiveImage(src, '(max-width: 767px) 50vw, 33vw', 828)} alt={`${name}, photo ${n + 1}`} loading={n < 6 ? 'eager' : 'lazy'} />
              </button>
            ))}
          </div>
        ) : (
          <div
            className="exp-lightbox__stage"
            onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touch.current === null) return;
              const dx = e.changedTouches[0].clientX - touch.current;
              touch.current = null;
              if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
            }}
          >
            <img key={view} className="exp-lightbox__img" {...responsiveImage(images[view], '100vw', 1920)} alt={`${name}, photo ${view + 1}`} />
            {count > 1 && (
              <>
                <button type="button" className="exp-lightbox__nav exp-lightbox__nav--prev" onClick={() => step(-1)} aria-label="Previous photo">
                  <ChevronLeft aria-hidden="true" />
                </button>
                <button type="button" className="exp-lightbox__nav exp-lightbox__nav--next" onClick={() => step(1)} aria-label="Next photo">
                  <ChevronRight aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function VwGallery({ images, name, onOpen }: { images: string[]; name: string; onOpen: (i: number) => void }) {
  const list = images.length ? images : ['/images/package-1.png'];
  const side = list.slice(1, 3);
  return (
    <div className={'vw-gallery' + (side.length ? ' has-side' : '') + (side.length === 1 ? ' is-two' : '')}>
      <button type="button" className="vw-gallery__main" onClick={() => images.length && onOpen(0)} aria-label={`View photos of ${name}`}>
        <img {...responsiveImage(list[0], GALLERY_MAIN_SIZES, GALLERY_MAIN_MAX)} alt={name} loading="eager" fetchPriority="high" />
        {images.length > 1 ? (
          <span className="vw-gallery__count">
            <ImageIcon aria-hidden="true" />
            {images.length}
          </span>
        ) : null}
      </button>
      {side.length ? (
        <div className="vw-gallery__side">
          {side.map((src, n) => (
            <button key={src + n} type="button" className="vw-gallery__item" onClick={() => onOpen(n + 1)} aria-label={`View photo ${n + 2}`}>
              <img {...responsiveImage(src, '(max-width: 767px) 50vw, 400px', 828)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function VwRail({ label, children }: { label: string; children: ReactNode }) {
  const rail = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = rail.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure, children]);

  const go = (dir: 1 | -1) => {
    const el = rail.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' });
  };

  return (
    <div className="vw-rail">
      <div className="vw-rail__track" ref={rail} onScroll={measure} role="region" aria-label={label}>
        {children}
      </div>
      {!edge.start ? (
        <button type="button" className="vw-rail__arrow vw-rail__arrow--prev" onClick={() => go(-1)} aria-label="Previous">
          <ArrowLeft aria-hidden="true" />
        </button>
      ) : null}
      {!edge.end ? (
        <button type="button" className="vw-rail__arrow vw-rail__arrow--next" onClick={() => go(1)} aria-label="Next">
          <ArrowRight aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

function ReviewItem({ name, date, text }: { name: string; date: string; text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="vw-rv">
      <p className="vw-rv__by">
        <b>{name}</b>
        <span>· {date}</span>
      </p>
      <p className={'vw-rv__text' + (open ? ' is-open' : '')}>{text}</p>
      {text.length > 180 ? (
        <button type="button" className="vw-rv__more" onClick={() => setOpen((v) => !v)}>
          {open ? 'Read less' : '...Read more'}
        </button>
      ) : null}
    </article>
  );
}

export function VwReviews() {
  if (!REVIEWS.length) return null;
  return (
    <section id="reviews" className="vw-reviews" aria-labelledby="vw-reviews-title">
      <div className="vw-reviews__head">
        <h2 id="vw-reviews-title">Why travellers love this</h2>
        <p className="vw-reviews__loved">
          Loved by <b>10,000+</b> travellers
        </p>
      </div>
      <VwRail label="Traveller reviews">
        {REVIEWS.map((r) => (
          <ReviewItem key={r.name + r.date} name={r.name} date={r.date} text={r.text} />
        ))}
      </VwRail>
    </section>
  );
}

export function VwPriceCard({
  from,
  duration,
  onBook,
  whatsappText,
}: {
  from: From;
  duration: string;
  onBook: () => void;
  whatsappText?: string;
}) {
  const off = from?.now != null && from.strike && from.strike > from.now ? Math.round((1 - from.now / from.strike) * 100) : 0;
  const basis = from?.basis ? from.basis.replace(/^starting price\s*/i, '').replace(/^price\s*/i, '') : 'per person';

  return (
    <div className="vw-price">
      <div className="vw-price__row">
        <div className="vw-price__col">
          <p className="vw-price__label">
            Price {basis}
            <span>Starts from</span>
          </p>
          <p className="vw-price__amount">{from?.now != null ? money(from.now) : 'Revealing soon'}</p>
        </div>
        {off > 0 && from?.strike ? (
          <div className="vw-price__col">
            <p className="vw-price__label">
              Regular price
              <span>You save {off}%</span>
            </p>
            <p className="vw-price__amount vw-price__amount--was">
              <s>{money(from.strike)}</s>
            </p>
          </div>
        ) : duration ? (
          <div className="vw-price__col">
            <p className="vw-price__label">
              Duration
              <span>Days / nights</span>
            </p>
            <p className="vw-price__amount">{duration}</p>
          </div>
        ) : null}
      </div>
      <button type="button" className="vw-btn vw-btn--brand vw-price__cta" onClick={onBook}>
        See price
      </button>
      <div className="vw-price__actions">
        <a href={whatsappHref(whatsappText)} target="_blank" rel="noopener noreferrer">
          <MessageCircle aria-hidden="true" />
          WhatsApp Us
        </a>
        <a href={CONTACT.uaePhoneHref}>
          <Phone aria-hidden="true" />
          Call Us
        </a>
      </div>
    </div>
  );
}

export type NavItem = { id: string; label: string };

const DOCK_ICONS: Record<string, LucideIcon> = {
  overview: Compass,
  reviews: MessageSquareQuote,
  itinerary: Route,
  info: ListChecks,
  know: Info,
};

export const SCROLL_OFFSET = 88;

export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET, behavior: 'smooth' });
}

export function VwDock({ items, onBook, cta }: { items: NavItem[]; onBook: () => void; cta: boolean }) {
  const [active, setActive] = useState(items[0]?.id ?? '');
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const els = items.map((it) => document.getElementById(it.id)).filter((el): el is HTMLElement => !!el);
    const footer = document.querySelector('.ex-footer');
    const onScroll = () => {
      const line = window.innerHeight * 0.35;
      const first = els[0];
      const footTop = footer ? footer.getBoundingClientRect().top : Infinity;
      setShown(!!first && first.getBoundingClientRect().top < window.innerHeight * 0.85 && footTop > window.innerHeight - 40);
      if (!els.length) return;
      let current = els[0].id;
      els.forEach((el) => {
        if (el.getBoundingClientRect().top <= line) current = el.id;
      });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = els[els.length - 1].id;
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [items]);

  const go = (id: string) => {
    setActive(id);
    scrollToSection(id);
  };

  return (
    <nav className={'vw-dock' + (shown ? ' is-shown' : '') + (cta ? ' has-cta' : '')} aria-label="Holiday details" aria-hidden={!shown}>
      <ul className="vw-dock__tabs">
        {items.map((it) => {
          const Icon = DOCK_ICONS[it.id] ?? Info;
          const on = active === it.id;
          return (
            <li key={it.id}>
              <button type="button" className={'vw-dock__tab' + (on ? ' is-active' : '')} onClick={() => go(it.id)} aria-current={on ? 'true' : undefined} tabIndex={shown ? 0 : -1}>
                <Icon aria-hidden="true" />
                <span>{it.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {cta ? (
        <>
          <span className="vw-dock__rule" aria-hidden="true" />
          <button type="button" className="vw-dock__cta" onClick={onBook} tabIndex={shown ? 0 : -1}>
            See price
          </button>
        </>
      ) : null}
    </nav>
  );
}

export function VwPriceBar({ from, onBook, hide }: { from: From; onBook: () => void; hide: boolean }) {
  const [atFooter, setAtFooter] = useState(false);

  useEffect(() => {
    const footer = document.querySelector('.ex-footer');
    if (!footer) return;
    const io = new IntersectionObserver(([e]) => setAtFooter(e.isIntersecting));
    io.observe(footer);
    return () => io.disconnect();
  }, []);

  const shown = !hide && !atFooter;
  const basis = from?.basis ? from.basis.replace(/^starting price\s*/i, '').replace(/^price\s*/i, '') : 'per person';

  return (
    <div className={'vw-pricebar' + (shown ? ' is-shown' : '')} aria-hidden={!shown}>
      <div className="vw-pricebar__price">
        <small>Starting from</small>
        <b>
          {from?.now != null ? money(from.now) : 'Price revealing soon'}
          {from?.now != null ? <span>{basis}</span> : null}
        </b>
        {from?.now != null && from.strike && from.strike > from.now ? <s>{money(from.strike)}</s> : null}
      </div>
      <button type="button" className="vw-pricebar__cta" onClick={onBook} tabIndex={shown ? 0 : -1}>
        See price
      </button>
    </div>
  );
}

export function VwRoute({ days, onView }: { days: ItineraryDay[]; onView: () => void }) {
  if (!days.length) return null;
  return (
    <div className="vw-route">
      <p className="vw-route__title">Your route</p>
      <ol className="vw-route__list">
        {days.map((d, n) => (
          <li key={d.day + '-' + n} className="vw-route__day">
            <span className="vw-route__dot" aria-hidden="true" />
            <span className="vw-route__label">Day {d.day}</span>
            <span className="vw-route__name">{titleCase(d.title)}</span>
          </li>
        ))}
      </ol>
      <div className="vw-route__actions">
        <button type="button" onClick={onView}>
          <Route aria-hidden="true" />
          Full itinerary
        </button>
      </div>
    </div>
  );
}

export function VwSection({ id, title, small, sub, aside, children }: { id: string; title: string; small?: string; sub?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="vw-sec" aria-labelledby={id + '-title'}>
      <div className="vw-sec__head">
        <div>
          <h2 id={id + '-title'}>
            {title}
            {small ? <small>{small}</small> : null}
          </h2>
          {sub ? <p>{sub}</p> : null}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function VwItinerary({ days }: { days: ItineraryDay[] }) {
  const [open, setOpen] = useState<number[]>([]);
  const all = open.length === days.length;
  const toggle = (n: number) => setOpen((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n]));

  return (
    <VwSection
      id="itinerary"
      title="Itinerary"
      small="(Day Wise)"
      aside={
        <button type="button" className="vw-sec__link" onClick={() => setOpen(all ? [] : days.map((_, n) => n))}>
          {all ? 'Hide all days' : 'View all days'}
        </button>
      }
    >
      <ol className="vw-days">
        {days.map((d, n) => {
          const on = open.includes(n);
          return (
            <li key={d.day + '-' + n} className={'vw-day' + (on ? ' is-open' : '')}>
              <span className="vw-day__pin" aria-hidden="true">
                <MapPin />
              </span>
              <div className="vw-day__main">
                <button type="button" className="vw-day__head" aria-expanded={on} onClick={() => toggle(n)}>
                  <span className="vw-day__text">
                    <span className="vw-day__label">Day {d.day}</span>
                    <span className="vw-day__title">{titleCase(d.title)}</span>
                  </span>
                  <span className="vw-day__toggle" aria-hidden="true">
                    {on ? <Minus /> : <Plus />}
                  </span>
                </button>
                {on ? <div className="exp-rich vw-day__body" dangerouslySetInnerHTML={{ __html: d.html }} /> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </VwSection>
  );
}

export function VwTabs({ tabs }: { tabs: { id: string; label: string; body: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? '');
  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  if (!current) return null;
  return (
    <div className="vw-tabs">
      <div className="vw-tabs__bar" role="tablist" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={t.id === current.id} className={'vw-tabs__tab' + (t.id === current.id ? ' is-active' : '')} onClick={() => setActive(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="vw-tabs__panel" role="tabpanel">
        {current.body}
      </div>
    </div>
  );
}

export function VwList({ items }: { items: Array<{ text: string; head: boolean }> }) {
  return (
    <ul className="vw-list">
      {items.map((it, n) =>
        it.head ? (
          <li key={n} className="vw-list__head">
            {it.text.replace(/:\s*$/, '')}
          </li>
        ) : (
          <li key={n}>{it.text}</li>
        ),
      )}
    </ul>
  );
}

export function VwOverview({ html }: { html: string }) {
  const [open, setOpen] = useState(false);
  const long = plain(html).length > 520;
  return (
    <VwSection id="overview" title="About this holiday">
      <div className={'exp-rich vw-overview' + (long && !open ? ' is-clamped' : '')} dangerouslySetInnerHTML={{ __html: html }} />
      {long ? (
        <button type="button" className="vw-sec__link vw-overview__more" onClick={() => setOpen((v) => !v)}>
          {open ? 'Read less' : 'Read more'}
        </button>
      ) : null}
    </VwSection>
  );
}

export function VwRelated({ items, title, href, loading = false }: { items: ListingItem[]; title: string; href: string; loading?: boolean }) {
  if (!items.length && !loading) return null;
  if (!items.length) {
    return (
      <section className="vw-related" aria-busy="true" aria-label="Loading more holidays">
        <div className="ex-wrap">
          <div className="vw-related__head">
            <span className="exl-skel vw-skel--h2" />
          </div>
          <div className="vw-rail">
            <div className="vw-rail__track">
              {Array.from({ length: 4 }, (_, i) => (
                <ExCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }
  return (
    <section className="vw-related" aria-labelledby="vw-related-title">
      <div className="ex-wrap">
        <div className="vw-related__head">
          <h2 id="vw-related-title">{title}</h2>
          <Link href={href} className="vw-sec__link">
            View all
          </Link>
        </div>
        <VwRail label={title}>
          {items.map((it) => (
            <ExCard key={it.id} p={it} headingAs="h4" />
          ))}
        </VwRail>
      </div>
    </section>
  );
}
