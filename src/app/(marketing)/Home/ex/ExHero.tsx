'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DeferredVideo from '@/components/site/DeferredVideo';
import { Search } from 'lucide-react';
import { HOLIDAY_TYPES, holidaysHref } from '@/config/holiday-types';
import {
  applyAgentDiscount,
  getAgentDiscountPercentage,
} from '@/lib/agent-discount';
import HolidaySearchSheet from '../sections/search/HolidaySearchSheet';
import '../sections/search/mobile-search.css';
import {
  formatAed,
  marinaFromPrice,
  startingPrice,
  useCategoryPackages,
  useIsAgent,
  useMarinaPackages,
  type HomePackage,
} from '../home-data';
import { HERO, TRAVELLERS, type HeroType } from './content';
import ExHeroArc, { type ArcCard } from './ExHeroArc';
import './hero-arc.css';

const TYPE_MS = 60;
const DELETE_MS = 28;
const HOLD_MS = 2000;
const NEXT_MS = 300;

function useTyping(items: string[]) {
  const [text, setText] = useState(items[0] ?? '');
  useEffect(() => {
    if (
      items.length < 2 ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return;
    let index = 0;
    let length = items[0].length;
    let mode: 'hold' | 'delete' | 'type' = 'hold';
    let timer = 0;
    const tick = () => {
      if (mode === 'hold') {
        mode = 'delete';
        timer = window.setTimeout(tick, DELETE_MS);
        return;
      }
      if (mode === 'delete') {
        length -= 1;
        setText(items[index].slice(0, length));
        if (length > 0) {
          timer = window.setTimeout(tick, DELETE_MS);
          return;
        }
        index = (index + 1) % items.length;
        mode = 'type';
        timer = window.setTimeout(tick, NEXT_MS);
        return;
      }
      length += 1;
      setText(items[index].slice(0, length));
      if (length >= items[index].length) {
        mode = 'hold';
        timer = window.setTimeout(tick, HOLD_MS);
        return;
      }
      timer = window.setTimeout(tick, TYPE_MS + Math.random() * 50);
    };
    timer = window.setTimeout(tick, HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [items]);
  return text;
}

function SearchPill() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const openSheet = () => setOpen(true);
  const hint = useTyping(HERO.search);

  return (
    <>
      <div className='ex-search'>
        <div className='ex-search__bar'>
          <button
            type='button'
            className='ex-search__field ex-search__field--simple'
            onClick={openSheet}
            aria-haspopup='dialog'
            aria-label={HERO.search[0]}
          >
            <span className='ex-search__ph ex-arc__type' aria-hidden='true'>
              {hint}
              <span className='ex-arc__caret' />
            </span>
          </button>
          <button
            type='button'
            className='ex-search__go'
            onClick={openSheet}
            aria-label='Search holidays'
          >
            <Search aria-hidden='true' />
          </button>
        </div>
      </div>
      <HolidaySearchSheet open={open} onClose={close} />
    </>
  );
}

function lowest(
  packages: HomePackage[],
  price: (p: HomePackage) => number | null,
  isAgent: boolean,
  discount: boolean
) {
  let best: number | null = null;
  for (const pkg of packages) {
    const base = price(pkg);
    if (base == null) continue;
    const value = discount
      ? applyAgentDiscount(base, getAgentDiscountPercentage(pkg, isAgent))
      : base;
    if (best == null || value < best) best = value;
  }
  return best;
}

function useFromPrices(): Record<HeroType, number | null> {
  const isAgent = useIsAgent();
  const offers = useCategoryPackages('offer-packages').packages;
  const anydate = useCategoryPackages('flexible-date-packages').packages;
  const tours = useCategoryPackages('uae-tours').packages;
  const marina = useMarinaPackages().packages;

  return useMemo(
    () => ({
      'offer-packages': lowest(offers, startingPrice, isAgent, true),
      'flexible-date-packages': lowest(anydate, startingPrice, isAgent, true),
      'uae-tours': lowest(tours, startingPrice, isAgent, true),
      'marina-cruise': lowest(marina, marinaFromPrice, isAgent, false),
    }),
    [offers, anydate, tours, marina, isAgent]
  );
}

function Title() {
  return <h1 className='ex-arc__title'>{HERO.title}</h1>;
}

export default function ExHero() {
  const prices = useFromPrices();

  const cards = useMemo<ArcCard[]>(
    () =>
      HERO.cards.map(card => {
        const type = HOLIDAY_TYPES.find(t => t.key === card.type);
        const from = prices[card.type];
        const label = type?.label ?? '';
        return {
          key: card.name,
          label: card.label,
          meta: from != null ? `${label} · from ${formatAed(from)}` : label,
          href: holidaysHref(card.type),
          small: `/images/hero/${card.name}-400.webp`,
          large: `/images/hero/${card.name}-720.webp`,
          video: card.video,
        };
      }),
    [prices]
  );

  return (
    <section className='ex-hero ex-hero--arc' aria-label={HERO.title}>
      <div className='ex-arc__bg' aria-hidden='true'>
        <DeferredVideo
          src='/videos/hero-dubai-sunset.mp4'
          poster='/images/hero/hero-dubai-sunset-poster.webp'
          priority
          autoPlay
          muted
          loop
          playsInline
        />
      </div>
      <div className='ex-arc__intro'>
        <Title />
        <SearchPill />
        <div className='ex-who'>
          <p className='ex-who__title'>Who&rsquo;s coming along</p>
          <ul className='ex-who__list'>
            {TRAVELLERS.map(t => (
              <li key={t.label}>
                <Link href={t.href} className='ex-who__item'>
                  <span className='ex-who__ring'>
                    <img
                      src={t.image}
                      width='240'
                      height='240'
                      alt=''
                      loading='lazy'
                      decoding='async'
                    />
                  </span>
                  <span className='ex-who__label'>{t.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <ExHeroArc cards={cards} />
    </section>
  );
}
