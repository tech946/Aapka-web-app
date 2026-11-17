import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowDown,
  ArrowRight,
  CalendarDays,
  Compass,
  Headset,
  Ship,
  SlidersHorizontal,
  Stamp,
  Sun,
  Tag,
  type LucideIcon,
} from 'lucide-react';
import { FOUNDER, HERO, ONE_ROOF, STORY, WHY_CARDS, WHY_HIGHLIGHT } from './content';

const ICONS: Record<string, LucideIcon> = {
  compass: Compass,
  calendar: CalendarDays,
  sun: Sun,
  ship: Ship,
  stamp: Stamp,
  sliders: SlidersHorizontal,
  tag: Tag,
  headset: Headset,
};

function Hero() {
  return (
    <section className="ab-hero" aria-labelledby="ab-hero-title">
      <div className="ab-hero__bg" aria-hidden="true">
        <img src={HERO.image} alt="" fetchPriority="high" />
      </div>
      <div className="ab-hero__body ex-wrap">
        <h1 id="ab-hero-title" className="ab-hero__title">
          {HERO.title}
        </h1>
        <p className="ab-hero__sub">{HERO.sub}</p>
      </div>
      <a href={HERO.next} className="ab-hero__next" aria-label="Scroll to our story">
        <ArrowDown aria-hidden="true" />
      </a>
    </section>
  );
}

type SplitProps = {
  id: string;
  anchor?: string;
  className: string;
  kicker: string;
  title: string;
  paragraphs: string[];
  pillars: { label: string; text: string }[];
  images: { main: { src: string; small?: string; alt: string }; side: { src: string; alt: string } };
  badge: { stat: string; label: string };
  footer: ReactNode;
};

function Split({ id, anchor, className, kicker, title, paragraphs, pillars, images, badge, footer }: SplitProps) {
  return (
    <section id={anchor} className={className} aria-labelledby={id}>
      <div className="ex-wrap ab-story__grid">
        <div className="ab-story__media">
          <img
            className="ab-story__main"
            src={images.main.src}
            srcSet={images.main.small ? `${images.main.small} 720w, ${images.main.src} 1400w` : undefined}
            sizes={images.main.small ? '(max-width: 767px) 90vw, 720px' : undefined}
            alt={images.main.alt}
            loading="lazy"
          />
          <img className="ab-story__side" src={images.side.src} alt={images.side.alt} loading="lazy" />
          <p className="ab-story__badge">
            <b>{badge.stat}</b>
            <span>{badge.label}</span>
          </p>
        </div>
        <div className="ab-story__text">
          <p className="ab-kicker">{kicker}</p>
          <h2 id={id} className="ab-h2">
            {title}
          </h2>
          {paragraphs.map((p) => (
            <p key={p} className="ab-story__p">
              {p}
            </p>
          ))}
          <dl className="ab-story__pillars">
            {pillars.map((p) => (
              <div key={p.label}>
                <dt>{p.label}</dt>
                <dd>{p.text}</dd>
              </div>
            ))}
          </dl>
          {footer}
        </div>
      </div>
    </section>
  );
}

function Story() {
  return (
    <Split
      id="ab-story-title"
      anchor="our-story"
      className="ab-story"
      {...STORY}
      footer={
        <Link href={STORY.guests.href} className="ab-guests">
          <span className="ab-guests__faces" aria-hidden="true">
            {STORY.guests.photos.map((src) => (
              <img key={src} src={src} alt="" width="96" height="96" loading="lazy" />
            ))}
          </span>
          <span className="ab-guests__text">
            <b>{STORY.guests.title}</b>
            <span>{STORY.guests.text}</span>
          </span>
          <ArrowRight className="ab-guests__arrow" aria-hidden="true" />
        </Link>
      }
    />
  );
}

function Founder() {
  const { sign } = FOUNDER;
  return (
    <Split
      id="ab-founder-title"
      className="ab-story ab-story--flip ab-founder"
      {...FOUNDER}
      footer={
        <Link href={sign.href} className="ab-guests">
          <span className="ab-guests__faces" aria-hidden="true">
            <img src={sign.photo} alt="" width="96" height="96" loading="lazy" />
          </span>
          <span className="ab-guests__text">
            <b>{sign.name}</b>
            <span>
              {sign.role} · {sign.cta}
            </span>
          </span>
          <ArrowRight className="ab-guests__arrow" aria-hidden="true" />
        </Link>
      }
    />
  );
}

function Why() {
  return (
    <section className="ex-pop ex-why ab-why" aria-label="Why travellers choose Aapka Tourism">
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
          {WHY_CARDS.map((c) => (
            <li key={c.label} className="ex-why__card">
              <img className="ex-why__img" src={c.image} alt="" loading="lazy" />
              <p className="ex-why__stat">
                {c.stat ? <b>{c.stat}</b> : null} {c.label}
              </p>
              <p className="ex-why__text">{c.text}</p>
              <Link href={c.href} className="ex-why__link">
                {c.cta}
                <ArrowRight aria-hidden="true" />
              </Link>
            </li>
          ))}
          <li className="ex-why__card ex-why__card--hot">
            <p className="ex-why__big">{WHY_HIGHLIGHT.stat}</p>
            <p className="ex-why__biglabel">{WHY_HIGHLIGHT.label}</p>
            <p className="ex-why__text">{WHY_HIGHLIGHT.text}</p>
            <a href={WHY_HIGHLIGHT.href} target="_blank" rel="noopener noreferrer" className="ex-why__link">
              {WHY_HIGHLIGHT.cta}
              <ArrowRight aria-hidden="true" />
            </a>
          </li>
        </ul>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section className="ab-svc" aria-labelledby="ab-svc-title">
      <div className="ex-wrap">
        <div className="ex-pop__head ab-svc__head">
          <p className="ab-svc__kicker">{ONE_ROOF.kicker}</p>
          <h2 id="ab-svc-title" className="ab-svc__title">
            {ONE_ROOF.title}
          </h2>
        </div>
        <ul className="ab-svc__grid">
          {ONE_ROOF.items.map((it) => {
            const Icon = ICONS[it.icon] ?? Compass;
            return (
              <li key={it.title}>
                <Link href={it.href} className="ab-svc__item">
                  <span className="ab-svc__icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <b className="ab-svc__name">{it.title}</b>
                  <span className="ab-svc__text">{it.text}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default function AboutEx() {
  return (
    <main className="ab">
      <Hero />
      <Story />
      <Founder />
      <Why />
      <Services />
    </main>
  );
}
