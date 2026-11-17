'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import HeroSearch from './search/HeroSearch';
import { packageHref, priceLabel, startingPrice, useCategoryPackages, useIsAgent } from '../home-data';

/* The ink panel under the hero video (pickyourtrail.com's): it rises
   over the bottom of the video with a dashed inner outline. The rating line,
   headline and search sit on its top edge (the search centred on the edge);
   then "what are you planning" circles, an "exclusive" package row, and a
   brand-orange marquee strip. Same layout on phones, smaller. */

const KINDS = [
  { label: 'Dubai Holidays', href: '/holidays?type=offer-packages', img: '/images/about-section-3.jpg', pos: '50% 35%' },
  { label: 'UAE Tours', href: '/holidays?type=uae-tours', img: '/images/package-2.jpg', pos: '40% 50%' },
  { label: 'Flexible Dates', href: '/holidays?type=flexible-date-packages', img: '/images/about-hero.jpg', pos: '30% 50%' },
  { label: 'Marina Cruise', href: '/holidays?type=marina-cruise', img: '/assets/images/tcHolidays/tcHome/dubai.avif', pos: '50% 50%' },
  { label: 'Oman Visa', href: '/visas/apply-for-oman-visa', img: '/assets/images/tcHolidays/holidaysLP/WhyThomasCook/why-thomas-ccok-bg.jpg', pos: '72% 40%' },
];

const MARQUEE = '#AapkaTourism';

function nightsLabel(nights?: number | null, days?: number | null): string {
  const n = nights ?? (days && days > 1 ? days - 1 : 0);
  return n > 0 ? `${n} night${n > 1 ? 's' : ''}` : days ? `${days} day${days > 1 ? 's' : ''}` : '';
}

function Exclusive() {
  const isAgent = useIsAgent();
  const { packages } = useCategoryPackages('offer-packages');
  const rowRef = useRef<HTMLDivElement>(null);
  if (!packages.length) return null;

  const step = (dir: 1 | -1) => {
    const row = rowRef.current;
    if (row) row.scrollBy({ left: dir * row.clientWidth * 0.9, behavior: 'smooth' });
  };

  return (
    <div className="hp_block">
      <p className="hp_label">Exclusive with Aapka Tourism</p>
      <div className="hp_excl">
        <button type="button" className="hp_arrow hp_arrow--prev" onClick={() => step(-1)} aria-label="Previous packages">
          <ChevronLeft aria-hidden="true" />
        </button>
        <div className="hp_excl__row" ref={rowRef}>
          {packages.map((p) => {
            const nights = nightsLabel(p.package_nights, p.package_days);
            return (
              <Link href={packageHref(p, 'Offer Packages')} className="hp_card" key={p.package_id}>
                <span className="hp_card__img">
                  <img src={p.thumbnail_image || '/images/package-1.png'} alt="" loading="lazy" />
                </span>
                <span className="hp_card__body">
                  <b className="hp_card__name">{p.package_name}</b>
                  <span className="hp_card__from">Packages starts from</span>
                  <span className="hp_card__price">
                    <b>{priceLabel(p, isAgent)}</b>
                    {startingPrice(p) != null ? <small>/Person{nights ? ` - ${nights}` : ''}</small> : null}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
        <button type="button" className="hp_arrow hp_arrow--next" onClick={() => step(1)} aria-label="Next packages">
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default function HeroPanel() {
  return (
    <section className="hp">
      {/* desktop: headline + search on the panel's top edge, over the video */}
      <div className="hp_lead">
        <p className="hp_rating">
          <span className="hp_rating__stars" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
            ))}
          </span>
          Loved by 10,000+ travellers
        </p>
        <span className="hp_rating__line" aria-hidden="true" />
        <h1 className="hp_title">Dubai &amp; UAE holidays, made easy</h1>
        <HeroSearch />
      </div>

      <div className="hp_block">
        <p className="hp_label">What are you planning?</p>
        <ul className="hp_kinds">
          {KINDS.map((k) => (
            <li key={k.label}>
              <Link href={k.href} className="hp_kind">
                <span className="hp_kind__img">
                  <img src={k.img} alt="" loading="lazy" style={{ objectPosition: k.pos }} />
                </span>
                <span className="hp_kind__label">{k.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <span className="hp_divider" aria-hidden="true" />

      <Exclusive />

      <div className="hp_marquee" aria-hidden="true">
        <div className="hp_marquee__track">
          {Array.from({ length: 16 }, (_, i) => (
            <span key={i}>{MARQUEE}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
