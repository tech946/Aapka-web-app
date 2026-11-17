'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BadgeCheck, Flame, Sailboat, Sparkles, Zap } from 'lucide-react';
import { categorySlug } from '@/components/site/site-config';
import { LIMITED_DEALS, holidaysHref, typeForCategory } from '@/config/holiday-types';
import { generateShortSlug, parseDateStringToLocal } from '@/lib/utils';
import {
  categoryHref,
  dealHref,
  formatAed,
  marinaFromPrice,
  packageHref,
  plainText,
  priceLabel,
  shortDate,
  startingPrice,
  useAllPackages,
  useCategoryPackages,
  useHomeCategories,
  useIsAgent,
  useLimitedTimeDeals,
  useMarinaPackages,
  type HomeCategory,
  type HomePackage,
} from '../home-data';

type Tone = 'dark' | 'light';
type BadgeTone = 'gold' | 'green' | 'peach';

type CardData = {
  key: string;
  href: string;
  img?: string | null;
  title: string;
  sub?: string;
  price: string;
  strike?: string;
  off?: string;
  tag?: string;
  badge: { lead: string; accent: string; tone: BadgeTone; icon: ReactNode };
};

function daysLabel(pkg: HomePackage): string {
  const d = pkg.package_days ?? 0;
  const n = pkg.package_nights ?? 0;
  if (d > 0) return `${d} Days`;
  if (n > 0) return `${n} Nights`;
  return '';
}

function subLine(pkg: HomePackage, place = 'UAE'): string {
  const days = daysLabel(pkg);
  return days ? `${place} in ${days}` : place;
}

function priceParts(pkg: HomePackage, isAgent: boolean) {
  const label = priceLabel(pkg, isAgent);
  if (startingPrice(pkg) == null) return { price: label };
  const deal = Number(pkg.active_deal?.deal_adult_price);
  const was = Number(pkg.adult_price);
  if (deal > 0 && was > deal) {
    return { price: `From ${label}`, strike: formatAed(was), off: `${Math.round((1 - deal / was) * 100)}% off` };
  }
  return { price: `From ${label}` };
}

function useRail() {
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

  const step = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector('li');
    const width = card ? card.getBoundingClientRect().width + 20 : 340;
    el.scrollBy({ left: dir * width * Math.max(1, Math.floor(el.clientWidth / width) - 1), behavior: 'smooth' });
  };

  return { ref, edges, step, update };
}

function Arrows({ edges, step }: { edges: { start: boolean; end: boolean }; step: (d: 1 | -1) => void }) {
  return (
    <div className="ex-arrows">
      <button type="button" className="ex-arrow" disabled={edges.start} onClick={() => step(-1)} aria-label="Previous">
        <ArrowLeft aria-hidden="true" />
      </button>
      <button type="button" className="ex-arrow" disabled={edges.end} onClick={() => step(1)} aria-label="Next">
        <ArrowRight aria-hidden="true" />
      </button>
    </div>
  );
}

function Card({ card }: { card: CardData }) {
  return (
    <li className="ex-card">
      <Link href={card.href} className="ex-card__link">
        <img className="ex-card__img" src={card.img || '/images/package-1.png'} alt="" loading="lazy" />
        <span className="ex-card__shade" aria-hidden="true" />
        <span className="ex-card__body">
          <span className={'ex-badge ex-badge--' + card.badge.tone}>
            {card.badge.icon}
            <span>
              {card.badge.lead} <em>{card.badge.accent}</em>
            </span>
          </span>
          <span className="ex-card__main">
            <span className="ex-card__title">{card.title}</span>
            {card.sub ? <span className="ex-card__sub">{card.sub}</span> : null}
            <span className="ex-card__price">
              <span className="ex-card__from">
                <b>{card.price}</b>
                {card.strike ? <s>{card.strike}</s> : null}
                {card.off ? <span className="ex-card__off">{card.off}</span> : null}
              </span>
              {card.tag ? <span className="ex-tag">{card.tag}</span> : null}
            </span>
          </span>
        </span>
      </Link>
    </li>
  );
}

function SkeletonCards() {
  return (
    <>
      {Array.from({ length: 4 }, (_, i) => (
        <li className="ex-card ex-card--skel" key={i} aria-hidden="true" />
      ))}
    </>
  );
}

function Band({
  tone,
  title,
  sub,
  aside,
  cards,
  loading,
  cta,
  label,
}: {
  tone: Tone;
  title: string;
  sub?: string | null;
  aside?: ReactNode;
  cards: CardData[];
  loading?: boolean;
  cta: { label: string; href: string };
  label: string;
}) {
  const { ref, edges, step, update } = useRail();
  useEffect(update, [cards.length, update]);

  return (
    <section className={'ex-band ex-band--' + tone} aria-label={label}>
      <div className="ex-wrap">
        <div className="ex-band__head">
          <div className="ex-band__titles">
            <div className="ex-band__title-row">
              <h2 className="ex-h2">{title}</h2>
              {aside}
            </div>
            {sub ? <p className="ex-band__sub">{sub}</p> : null}
          </div>
          <Arrows edges={edges} step={step} />
        </div>
        <ul className="ex-rail" ref={ref} aria-label={label}>
          {loading && !cards.length ? <SkeletonCards /> : cards.map((c) => <Card key={c.key} card={c} />)}
        </ul>
        <Link href={cta.href} className={'ex-btn ' + (tone === 'dark' ? 'ex-btn--light' : 'ex-btn--dark') + ' ex-band__cta'}>
          {cta.label}
        </Link>
      </div>
    </section>
  );
}

function useCountdown(endIso: string | null) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!endIso || now == null) return null;
  const end = parseDateStringToLocal(endIso);
  if (!end) return null;
  end.setHours(23, 59, 59, 999);
  const left = Math.max(0, end.getTime() - now);
  const h = Math.floor(left / 3_600_000);
  if (h > 99) return `${Math.ceil(left / 86_400_000)} DAYS LEFT`;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(Math.floor(left / 60_000) % 60)}:${pad(Math.floor(left / 1000) % 60)} LEFT`;
}

export function DealsBand() {
  const isAgent = useIsAgent();
  const { deals, isLoading } = useLimitedTimeDeals();
  const soonest = useMemo(() => [...deals].sort((a, b) => a.end_date.localeCompare(b.end_date))[0]?.end_date ?? null, [deals]);
  const timer = useCountdown(soonest);

  const cards: CardData[] = deals.flatMap((d) =>
    d.package
      ? [
          {
            key: d.id,
            href: dealHref(d.package),
            img: d.package.thumbnail_image,
            title: d.package.package_name,
            sub: subLine(d.package),
            ...priceParts(d.package, isAgent),
            tag: `Ends ${shortDate(d.end_date)}`,
            badge: { lead: 'Limited Time', accent: 'Deal', tone: 'gold' as const, icon: <Zap aria-hidden="true" /> },
          },
        ]
      : [],
  );

  if (isLoading || !cards.length) return null;
  return (
    <Band
      tone="dark"
      label={LIMITED_DEALS.label}
      title="Limited Time Deals"
      sub="Special prices on hand-picked holidays, for a short time only."
      aside={timer ? <span className="ex-timer">{timer}</span> : null}
      cards={cards}
      loading={isLoading}
      cta={{ label: 'See deals', href: holidaysHref(LIMITED_DEALS.key) }}
    />
  );
}

const BADGES: { tone: BadgeTone; icon: ReactNode }[] = [
  { tone: 'green', icon: <BadgeCheck aria-hidden="true" /> },
  { tone: 'peach', icon: <Sparkles aria-hidden="true" /> },
  { tone: 'gold', icon: <Flame aria-hidden="true" /> },
];

export function CategoryBand({ category, tone, index }: { category: HomeCategory; tone: Tone; index: number }) {
  const isAgent = useIsAgent();
  const slug = categorySlug(category.name);
  const { packages, isLoading } = useCategoryPackages(slug);
  const type = typeForCategory(slug, category.name);
  const badge = BADGES[index % BADGES.length];

  if (!isLoading && !packages.length) return null;

  const cards: CardData[] = packages.map((p) => ({
    key: p.package_id,
    href: packageHref(p, category.name),
    img: p.thumbnail_image,
    title: p.package_name,
    sub: subLine(p),
    ...priceParts(p, isAgent),
    tag: p.with_visa ? 'Visa included' : undefined,
    badge: { lead: 'Aapka', accent: type.cardLabel, ...badge },
  }));

  const sub = type.tagline ? `${type.tagline}. ${plainText(category.description)}`.slice(0, 220) : plainText(category.description).slice(0, 220);

  return (
    <Band
      tone={tone}
      label={type.label}
      title={type.label}
      sub={sub || null}
      cards={cards}
      loading={isLoading}
      cta={{ label: tone === 'dark' ? 'See deals' : 'See all deals', href: categoryHref(category.name) }}
    />
  );
}

export function CategoryBands({ from, to, tone }: { from: number; to?: number; tone: Tone }) {
  const { categories } = useHomeCategories();
  return (
    <>
      {categories.slice(from, to).map((c, n) => (
        <CategoryBand key={c.id} category={c} tone={tone} index={from + n} />
      ))}
    </>
  );
}

function nightsDays(pkg: HomePackage): string {
  const d = pkg.package_days ?? 0;
  const n = pkg.package_nights ?? (d > 0 ? d - 1 : 0);
  const part = (v: number, word: string) => `${v} ${word}${v === 1 ? '' : 's'}`;
  if (d > 0 && n > 0) return `${part(d, 'day')} / ${part(n, 'night')}`;
  if (d > 0) return part(d, 'day');
  if (n > 0) return part(n, 'night');
  return '';
}

function departures(pkg: HomePackage): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = (pkg.travel_dates ?? [])
    .map((d) => parseDateStringToLocal(typeof d === 'string' ? d : d.value))
    .filter((d): d is Date => !!d && d >= today).length;
  if (upcoming > 0) return `${upcoming} departure${upcoming === 1 ? '' : 's'}`;
  const slug = categorySlug(pkg.category_name ?? '');
  if (slug === 'flexible-date-packages') return 'Any date';
  if (slug === 'uae-tours') return 'Daily departures';
  return '';
}

export function usePager() {
  const ref = useRef<HTMLUListElement>(null);
  const [state, setState] = useState({ pages: 1, page: 0, start: true, end: true });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (el.clientWidth <= 0) {
      setState({ pages: 1, page: 0, start: true, end: true });
      return;
    }
    const raw = Math.ceil((el.scrollWidth - 2) / el.clientWidth);
    const pages = Number.isFinite(raw) ? Math.min(50, Math.max(1, raw)) : 1;
    const max = el.scrollWidth - el.clientWidth;
    const page = max <= 2 ? 0 : Math.round((el.scrollLeft / max) * (pages - 1));
    setState({ pages, page, start: el.scrollLeft <= 2, end: el.scrollLeft >= max - 2 });
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

  const go = (page: number) => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    el.scrollTo({ left: state.pages > 1 ? (max * page) / (state.pages - 1) : 0, behavior: 'smooth' });
  };

  const step = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' });
  };

  return { ref, ...state, go, step, update };
}

export function PopularBand() {
  const isAgent = useIsAgent();
  const { packages, isLoading } = useAllPackages();
  const { ref, pages, page, start, end, go, step, update } = usePager();
  useEffect(update, [packages.length, update]);

  if (!isLoading && !packages.length) return null;

  return (
    <section className="ex-pop" aria-label="Popular packages">
      <div className="ex-wrap">
        <div className="ex-pop__head">
          <h2 className="ex-pop__title">
            <span className="ex-pop__dash" aria-hidden="true" />
            <span>
              Explore our most <b>Popular Packages</b>
            </span>
            <span className="ex-pop__dash" aria-hidden="true" />
          </h2>
          <p className="ex-pop__sub">Dubai &amp; UAE holidays, tours and cruises planned for you</p>
        </div>
        <div className="ex-pop__stage">
          <span className="ex-pop__side ex-pop__side--prev">
            <button type="button" className="ex-pop__arrow" disabled={start} onClick={() => step(-1)} aria-label="Previous">
              <ArrowLeft aria-hidden="true" />
            </button>
          </span>
          <ul className="ex-pop__rail" ref={ref} aria-label="Popular packages">
            {isLoading && !packages.length
              ? Array.from({ length: 5 }, (_, i) => (
                  <li className="ex-pop__card ex-pop__skel" key={i} aria-hidden="true">
                    <span className="ex-pop__skel-media" />
                    <span className="ex-pop__skel-line is-wide" />
                    <span className="ex-pop__skel-line" />
                    <span className="ex-pop__skel-line is-short" />
                    <span className="ex-pop__skel-line is-price" />
                  </li>
                ))
              : packages.map((p) => {
                  const meta = [nightsDays(p), departures(p)].filter(Boolean);
                  const hasPrice = startingPrice(p) != null;
                  return (
                    <li className="ex-pop__card" key={p.package_id}>
                      <Link href={packageHref(p)} className="ex-pop__link">
                        <span className="ex-pop__media">
                          <img src={p.thumbnail_image || '/images/package-1.png'} alt="" loading="lazy" />
                        </span>
                        <span className="ex-pop__name">{p.package_name}</span>
                        {meta.length ? (
                          <span className="ex-pop__meta">
                            {meta.map((m) => (
                              <span key={m}>{m}</span>
                            ))}
                          </span>
                        ) : null}
                        {hasPrice ? <span className="ex-pop__from">Starting from</span> : null}
                        <span className="ex-pop__price">{priceLabel(p, isAgent)}</span>
                      </Link>
                    </li>
                  );
                })}
          </ul>
          <span className="ex-pop__side ex-pop__side--next">
            <button type="button" className="ex-pop__arrow" disabled={end} onClick={() => step(1)} aria-label="Next">
              <ArrowRight aria-hidden="true" />
            </button>
          </span>
        </div>
        {pages > 1 ? (
          <div className="ex-pop__dots">
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                className={'ex-pop__dot' + (i === page ? ' is-active' : '')}
                onClick={() => go(i)}
                aria-label={`Page ${i + 1}`}
                aria-current={i === page}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function MarinaBand() {
  const { packages, isLoading } = useMarinaPackages();
  if (!isLoading && !packages.length) return null;

  const cards: CardData[] = packages.map((p) => {
    const from = marinaFromPrice(p);
    return {
      key: p.package_id,
      href: `/marina-cruise-dinner/${generateShortSlug(p.package_name, p.package_id)}`,
      img: p.thumbnail_image,
      title: p.package_name,
      sub: 'Dubai Marina',
      price: from ? `From ${formatAed(from)}` : 'Price revealing soon',
      badge: { lead: 'Marina', accent: 'Cruise', tone: 'peach', icon: <Sailboat aria-hidden="true" /> },
    };
  });

  return (
    <Band
      tone="light"
      label="Dubai Marina cruises"
      title="Dubai Marina cruises"
      sub="Dinner, music and the city lights from the water — pick your evening and we'll do the rest."
      cards={cards}
      loading={isLoading}
      cta={{ label: 'See all cruises', href: holidaysHref('marina-cruise') }}
    />
  );
}
