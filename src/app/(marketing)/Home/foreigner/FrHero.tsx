'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { HERO } from './content';
import { Roll } from './Art';

export default function FrHero() {
  const [motion, setMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: no-preference)');
    const sync = () => setMotion(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  return (
    <section className="fr-section fr-banner">
      <div className="fr-banner__media" aria-hidden="true">
        <img className="fr-banner__poster" src={HERO.poster} width="1920" height="1080" alt="" fetchPriority="high" />
        {motion ? (
          <video className="fr-banner__video" autoPlay muted loop playsInline preload="auto" poster={HERO.poster}>
            <source src={HERO.video} type="video/mp4" />
          </video>
        ) : null}
        <span className="fr-banner__shade" />
      </div>
      <div className="fr-container fr-container--big">
        <div className="fr-hero">
          <div className="fr-hero__title">
            <h1>{HERO.title}</h1>
          </div>
          <div className="fr-hero__cards">
            {HERO.cards.map((c) => (
              <HeroCard key={c.href} {...c} />
            ))}
          </div>
          <div className="fr-hero__lead">
            <div className="fr-h5">{HERO.lead}</div>
            <p className="fr-subtitle">{HERO.scroll}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroCard({ title, tag, href, image, color }: (typeof HERO.cards)[number]) {
  const pill = useRef<HTMLSpanElement>(null);
  const move = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    pill.current?.style.setProperty('transform', `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px) translate(-50%, -50%)`);
  };
  return (
    <div className="fr-hero__card">
      <Link href={href} className={'fr-card' + (color ? ' fr-card--' + color : '')} onMouseMove={move}>
        {color && (
          <div className="fr-card__text">
            <span className="fr-card__name">{title}</span>
            <p>{tag}</p>
          </div>
        )}
        <img className="fr-card__img" src={image} alt={color ? '' : title} />
        <span className="fr-card__bg" />
        <span className="fr-card__view" ref={pill}>
          <Roll bottomClass="fr-text-light">View holidays</Roll>
        </span>
      </Link>
    </div>
  );
}
