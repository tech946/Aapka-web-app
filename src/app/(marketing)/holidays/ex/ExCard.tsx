'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BadgeCheck,
  CalendarDays,
  Camera,
  Clock,
  Headset,
  Heart,
  Hotel,
  Moon,
  Plane,
  Ship,
  Tag,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import { titleCase } from '@/components/site/pdp/pdp-data';
import {
  formatAed,
  type Inclusion,
  type ListingItem,
} from '@/components/site/listing/listing-data';

const SAVED_KEY = 'aapka-saved-holidays';

const SAMPLE_RATING = { score: 4.8, count: 1240 };

function Star() {
  return (
    <svg viewBox='0 0 24 24' width='14' height='14' aria-hidden='true'>
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='m12.664 2.272.004-.012zm8.88 6.436-.012.009zM12.03 1.251a.81.81 0 0 1 .729.526l.005.015 2.172 6.68h7.012c.427 0 .686.308.766.569a.8.8 0 0 1-.3.89l-5.666 4.11 2.164 6.65a.8.8 0 0 1-.304.918.81.81 0 0 1-.927-.011l-.003-.002-5.68-4.117-5.673 4.116-.003.003a.805.805 0 0 1-1.242-.872l.004-.014 2.17-6.671-5.668-4.12-.003-.002a.805.805 0 0 1 .472-1.454h7.018l2.165-6.656a.8.8 0 0 1 .792-.558'
      />
    </svg>
  );
}

function hotelStars(p: ListingItem): number {
  const m = `${p.desc} ${p.name}`.match(/\b([3-5])\s*[-–]?\s*star\b/i);
  return m ? Number(m[1]) : 0;
}

function useSaved(id: string) {
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    try {
      const list: string[] = JSON.parse(
        window.localStorage.getItem(SAVED_KEY) || '[]'
      );
      setSaved(list.includes(id));
    } catch {
      setSaved(false);
    }
  }, [id]);
  const toggle = () => {
    setSaved(cur => {
      const next = !cur;
      try {
        const list: string[] = JSON.parse(
          window.localStorage.getItem(SAVED_KEY) || '[]'
        );
        const out = next
          ? [...new Set([...list, id])]
          : list.filter(x => x !== id);
        window.localStorage.setItem(SAVED_KEY, JSON.stringify(out));
      } catch {}
      return next;
    });
  };
  return { saved, toggle };
}

function Stars({ score }: { score: number }) {
  const row = Array.from({ length: 5 }, (_, i) => <Star key={i} />);
  return (
    <span className='exl-stars' aria-hidden='true'>
      <span className='exl-stars__base'>{row}</span>
      <span
        className='exl-stars__fill'
        style={{ width: `${Math.max(0, Math.min(5, score)) * 20}%` }}
      >
        {row}
      </span>
    </span>
  );
}

type Feature = { key: string; icon: LucideIcon; text: string };

const INCLUSION_FEATURES: Partial<
  Record<Inclusion, { icon: LucideIcon; text: string }>
> = {
  Meals: { icon: UtensilsCrossed, text: 'Meals' },
  Flights: { icon: Plane, text: 'Flights' },
  Sightseeing: { icon: Camera, text: 'Sightseeing' },
  Cruise: { icon: Ship, text: 'Cruise' },
  Guide: { icon: Headset, text: 'Tour guide' },
};

function featuresOf(p: ListingItem): Feature[] {
  const out: Feature[] = [];
  if (p.nights > 0)
    out.push({
      key: 'nights',
      icon: Moon,
      text: `${p.nights}N / ${p.nights + 1}D`,
    });
  else
    out.push({ key: 'day', icon: Clock, text: p.durationLabel || 'Day Tour' });
  const stars = hotelStars(p);
  if (stars)
    out.push({ key: 'hotel', icon: Hotel, text: `${stars}-Star hotel` });
  else if (p.inclusions.includes('Hotels'))
    out.push({ key: 'hotel', icon: Hotel, text: 'Hotel stay' });
  if (p.visa || p.inclusions.includes('Visa'))
    out.push({ key: 'visa', icon: BadgeCheck, text: 'Visa included' });
  if (p.availability)
    out.push({ key: 'avail', icon: CalendarDays, text: p.availability });
  p.inclusions.forEach(i => {
    const f = INCLUSION_FEATURES[i];
    if (f) out.push({ key: i, ...f });
  });
  return out;
}

const FEAT_GAP = 16;
const FEAT_ROWS = 2;

function rowsUsed(widths: number[], max: number): number {
  let row = 1;
  let x = 0;
  for (const w of widths) {
    if (x > 0 && x + FEAT_GAP + w > max) {
      row += 1;
      x = w;
    } else {
      x = x > 0 ? x + FEAT_GAP + w : w;
    }
  }
  return row;
}

function Feats({ features }: { features: Feature[] }) {
  const ref = useRef<HTMLUListElement>(null);
  const sizes = useRef<{ items: number[]; more: number } | null>(null);
  const [limit, setLimit] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    const ul = ref.current;
    if (!ul) return;
    if (!sizes.current) {
      const items = Array.from(ul.querySelectorAll<HTMLElement>('[data-feat]')).map(el => el.getBoundingClientRect().width);
      const moreEl = ul.querySelector<HTMLElement>('[data-more]');
      sizes.current = { items, more: moreEl ? moreEl.getBoundingClientRect().width : 72 };
    }
    const fit = () => {
      const { items, more } = sizes.current!;
      const max = ul.clientWidth;
      if (!max) return;
      if (rowsUsed(items, max) <= FEAT_ROWS) {
        setLimit(items.length);
        return;
      }
      for (let k = items.length - 1; k >= 1; k--) {
        if (rowsUsed([...items.slice(0, k), more], max) <= FEAT_ROWS) {
          setLimit(k);
          return;
        }
      }
      setLimit(1);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(ul);
    return () => ro.disconnect();
  }, []);

  const measuring = limit === null;
  const hidden = measuring || open ? 0 : features.length - limit;
  const shown = hidden > 0 ? features.slice(0, limit ?? features.length) : features;

  return (
    <ul ref={ref} className="exl-card__feats" aria-label="What's included">
      {shown.map(f => {
        const Icon = f.icon;
        return (
          <li key={f.key} data-feat="">
            <Icon aria-hidden="true" />
            {f.text}
          </li>
        );
      })}
      {measuring ? (
        <li data-more="" className="exl-card__more-li is-measure" aria-hidden="true">
          <span className="exl-card__more">+9 more</span>
        </li>
      ) : hidden > 0 ? (
        <li className="exl-card__more-li">
          <button type="button" className="exl-card__more" onClick={() => setOpen(true)} aria-label={`Show ${hidden} more inclusions`}>
            +{hidden} more
          </button>
        </li>
      ) : open && limit !== null && limit < features.length ? (
        <li className="exl-card__more-li">
          <button type="button" className="exl-card__more" onClick={() => setOpen(false)}>
            Show less
          </button>
        </li>
      ) : null}
    </ul>
  );
}

export function ExCardSkeleton() {
  return (
    <div className='exl-card exl-card--skel' aria-hidden='true'>
      <span className='exl-skel exl-skel--media' />
      <div className='exl-card__body'>
        <span className='exl-skel exl-skel--name' />
        <span className='exl-skel exl-skel--name exl-skel--short' />
        <span className='exl-skel exl-skel--rating' />
        <div className='exl-skel__feats'>
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} className='exl-skel exl-skel--feat' />
          ))}
        </div>
        <div className='exl-card__bottom'>
          <div className='exl-card__foot'>
            <div className='exl-skel__price'>
              <span className='exl-skel exl-skel--from' />
              <span className='exl-skel exl-skel--price' />
            </div>
            <span className='exl-skel exl-skel--cta' />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExCard({ p, headingAs: Heading = 'h3' }: { p: ListingItem; headingAs?: 'h3' | 'h4' }) {
  const title = titleCase(p.name);
  const image = p.img || p.images[0] || '/images/package-1.png';
  const features = featuresOf(p);
  const { saved, toggle } = useSaved(p.id);
  const flag = p.visa
    ? { icon: BadgeCheck, text: 'Visa included' }
    : p.badge && !p.inDeal
      ? { icon: Tag, text: p.badge }
      : null;
  const FlagIcon = flag?.icon;
  const count = SAMPLE_RATING.count.toLocaleString('en-US');

  return (
    <article className='exl-card'>
      <div className='exl-card__media'>
        <Link
          href={p.href}
          className='exl-card__media-link'
          tabIndex={-1}
          aria-hidden='true'
        >
          <img src={image} alt='' loading='lazy' decoding='async' />
        </Link>
        {flag && FlagIcon ? (
          <span className='exl-card__flag'>
            <FlagIcon aria-hidden='true' />
            {flag.text}
          </span>
        ) : null}
        <button
          type='button'
          className={'exl-card__save' + (saved ? ' is-saved' : '')}
          onClick={toggle}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${title} from saved` : `Save ${title}`}
        >
          <Heart aria-hidden='true' />
        </button>
      </div>

      <div className='exl-card__body'>
        <Heading className='exl-card__name' title={title}>
          <Link href={p.href}>{title}</Link>
        </Heading>

        <p
          className='exl-card__rating'
          aria-label={`Rated ${SAMPLE_RATING.score} out of 5 from ${count} reviews`}
        >
          <span>{SAMPLE_RATING.score.toFixed(1)}</span>
          <Stars score={SAMPLE_RATING.score} />
          <span className='exl-card__count'>({count})</span>
        </p>

        {features.length ? <Feats features={features} /> : null}

        {p.inDeal && p.badge ? (
          <span className='exl-card__sponsored'>{p.badge}</span>
        ) : null}

        <div className='exl-card__bottom'>
          <div className='exl-card__foot'>
            <p className='exl-card__price'>
              <span>from</span>
              {p.price != null ? (
                <strong>{formatAed(p.price)}</strong>
              ) : (
                <strong>Revealing soon</strong>
              )}
            </p>
            <Link href={p.href} className='exl-card__cta'>
              View Details
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
