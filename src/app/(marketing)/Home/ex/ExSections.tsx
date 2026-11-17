'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, ChevronDown } from 'lucide-react';
import SocialIcon from '@/components/site/SocialIcon';
import { SOCIALS, categorySlug } from '@/components/site/site-config';
import { holidaysHref } from '@/config/holiday-types';
import { useAllPackages, useMarinaPackages } from '../home-data';
import { FOOTER, WHY } from './content';

export function WhyUs() {
  return (
    <section className="ex-pop ex-why" aria-label={WHY.title}>
      <div className="ex-wrap">
        <div className="ex-pop__head">
          <h2 className="ex-pop__title">
            <span className="ex-pop__dash" aria-hidden="true" />
            <span>
              Why Thousands of Travellers choose <b>Aapka Tourism</b>
            </span>
            <span className="ex-pop__dash" aria-hidden="true" />
          </h2>
        </div>
        <ul className="ex-why__grid">
          {WHY.cards.map((c) => (
            <li key={c.label} className="ex-why__card">
              <img className="ex-why__img" src={c.image} alt="" loading="lazy" />
              <p className="ex-why__stat">
                <b>{c.stat}</b> {c.label}
              </p>
              <p className="ex-why__text">{c.text}</p>
              <Link href={c.href} className="ex-why__link">
                {c.cta}
                <ArrowRight aria-hidden="true" />
              </Link>
            </li>
          ))}
          <li className="ex-why__card ex-why__card--hot">
            <p className="ex-why__big">{WHY.highlight.stat}</p>
            <p className="ex-why__biglabel">{WHY.highlight.label}</p>
            <p className="ex-why__text">{WHY.highlight.text}</p>
            <a href={WHY.highlight.href} target="_blank" rel="noopener noreferrer" className="ex-why__link">
              {WHY.highlight.cta}
              <ArrowRight aria-hidden="true" />
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}

const CATEGORY_CARDS = [
  { key: 'flexible-date-packages', label: 'Anydate Packages', image: '/images/stock/type-anydate.jpg' },
  { key: 'offer-packages', label: 'Offer Packages', image: '/images/stock/type-offers.jpg' },
  { key: 'uae-tours', label: 'UAE Tours', image: '/images/stock/type-tours.jpg' },
  { key: 'marina-cruise', label: 'Marina Cruise', image: '/images/stock/type-marina.jpg' },
];

export function WhereNext() {
  const { packages, isLoading } = useAllPackages();
  const { packages: cruises, isLoading: cruisesLoading } = useMarinaPackages();

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of packages) {
      const key = categorySlug(p.category_name ?? '');
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    map.set('marina-cruise', cruises.length);
    return map;
  }, [packages, cruises]);

  return (
    <section className="ex-pop ex-cat" aria-label="Holiday types">
      <div className="ex-wrap">
        <div className="ex-pop__head">
          <h2 className="ex-pop__title">
            <span className="ex-pop__dash" aria-hidden="true" />
            <span>
              Explore Dubai &amp; UAE Across <b>4 Holiday Types</b>
            </span>
            <span className="ex-pop__dash" aria-hidden="true" />
          </h2>
          <p className="ex-pop__sub ex-cat__sub">
            Anydate packages, offer packages, UAE tours and Marina cruises, with everything taken care of.
          </p>
        </div>
        <ul className="ex-cat__grid">
          {CATEGORY_CARDS.map((c) => {
            const loading = c.key === 'marina-cruise' ? cruisesLoading : isLoading;
            const n = counts.get(c.key) ?? 0;
            return (
              <li key={c.key}>
                <Link href={holidaysHref(c.key)} className="ex-cat__card">
                  <img src={c.image} alt="" loading="lazy" />
                  <span className="ex-cat__body">
                    {loading ? <span className="ex-cat__count ex-cat__count--skel" aria-hidden="true" /> : n > 0 ? <span className="ex-cat__count">{n === 1 ? '1 Package' : `${n} Packages`}</span> : null}
                    <span className="ex-cat__label">{c.label}</span>
                    <span className="ex-cat__btn">
                      View packages
                      <ArrowUpRight aria-hidden="true" />
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function FooterGroup({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div className="ex-ft__group">
      <h3>{title}</h3>
      <ul>
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link href={l.href}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ExFooter() {
  const [more, setMore] = useState(false);

  return (
    <footer className="ex-footer">
      <div className="ex-wrap">
        <div className="ex-ft__top">
          {FOOTER.columns.map((col) => (
            <FooterGroup key={col.title} title={col.title} links={col.links} />
          ))}
          <div className="ex-ft__stack">
            {FOOTER.stacked.map((col) => (
              <FooterGroup key={col.title} title={col.title} links={col.links} />
            ))}
          </div>
          <div className="ex-ft__group ex-ft__contact">
            <h3>Talk to Aapka Tourism</h3>
            <p>
              Plan your holiday with a travel expert on{' '}
              {FOOTER.reach.map((r, i) => (
                <span key={r.href}>
                  {i > 0 ? ' or ' : ''}
                  {r.label} <a href={r.href}>{r.text}</a>
                </span>
              ))}
              , or write to <a href={FOOTER.email.href}>{FOOTER.email.text}</a>
            </p>
          </div>
        </div>

        <div className="ex-ft__bottom">
          <div className="ex-ft__legalbox">
            <div className="ex-ft__brand">
              <Link href="/" className="ex-ft__logo" aria-label="Aapka Tourism home">
                <img src="/aapka-tourism-logo-dark.png" width="404" height="322" alt="" />
              </Link>
              <div>
                <p className="ex-ft__copy">© {new Date().getFullYear()} Aapka Tourism. All rights reserved.</p>
                <ul className="ex-ft__legal">
                  {FOOTER.legal.map((l) => (
                    <li key={l.href + l.label}>
                      <Link href={l.href}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <p className={'ex-ft__note' + (more ? ' is-open' : '')}>{FOOTER.caution}</p>
            <button type="button" className="ex-ft__more" onClick={() => setMore((v) => !v)} aria-expanded={more}>
              {more ? 'Read less' : 'Read more'}
              <ChevronDown aria-hidden="true" />
            </button>
          </div>

          <div className="ex-ft__prefs">
            <div className="ex-ft__pills">
              <span className="ex-ft__pref">
                <b>AED</b> UAE Dirham
              </span>
              <span className="ex-ft__pref">United Arab Emirates</span>
            </div>
            <ul className="ex-ft__social">
              {SOCIALS.map((s) => (
                <li key={s.id}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}>
                    <SocialIcon id={s.id} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
