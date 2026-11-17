import Link from 'next/link';
import type { ReactNode } from 'react';

/* Building blocks of the Tripadvisor-style homepage (ta-home.css). */

export function Section({ children, className = '', label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <section className={'ta-sec ' + className} aria-label={label}>
      {children}
    </section>
  );
}

/** 20px title with an optional muted line under it. */
export function Head({ title, sub }: { title: string; sub?: string | null }) {
  return (
    <div className="ta-head">
      <h2>{title}</h2>
      {sub ? <p>{sub}</p> : null}
    </div>
  );
}

/** Product card: square photo, grey chip, 18px title, a muted line, the price. */
export function CardItem({
  href,
  img,
  title,
  chip,
  chipTone,
  meta,
  price,
}: {
  href: string;
  img?: string | null;
  title: string;
  chip?: string;
  chipTone?: 'deal';
  meta?: string;
  price?: string;
}) {
  return (
    <li className="ta-rail__item">
      <Link href={href} className="ta-card">
        <span className="ta-card__media">
          <img src={img || '/images/package-1.png'} alt="" loading="lazy" />
        </span>
        <span className="ta-card__body">
          {chip ? <span className={'ta-chip' + (chipTone ? ' ta-chip--' + chipTone : '')}>{chip}</span> : null}
          <span className="ta-card__title">{title}</span>
          {meta ? <span className="ta-card__meta">{meta}</span> : null}
          {price ? <span className="ta-card__price">{price}</span> : null}
        </span>
      </Link>
    </li>
  );
}

/** Square photo tile with a big white label on a dark bottom fade. */
export function TileItem({ href, img, label, pos }: { href: string; img?: string | null; label: string; pos?: string }) {
  return (
    <li className="ta-rail__item">
      <Link href={href} className="ta-tile">
        <img src={img || '/images/package-1.png'} alt="" loading="lazy" style={pos ? { objectPosition: pos } : undefined} />
        <span className="ta-tile__label">{label}</span>
      </Link>
    </li>
  );
}

/** Placeholder cards while a row's data loads. */
export function SkeletonItems({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <li className="ta-rail__item" key={i} aria-hidden="true">
          <span className="ta-card__media ta-skel" />
        </li>
      ))}
    </>
  );
}
