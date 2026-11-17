'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Instagram, Sun } from 'lucide-react';
import { packageHref, useCategoryPackages, useIsAgent } from '../home-data';
import type { PromoSection, StoriesSection, TrustSection } from '@/content/home';

/* The wide promos of the Tripadvisor-style homepage: the grey split card
   (photo or video left, centred copy + dark pill right) and the dark awards
   band, here carrying Aapka's own claims (10,000+ travellers, 12+ years,
   98% coming back) — the only stats the site has ever stated. */

function Split({ media, kicker, title, body, cta, label }: { media: ReactNode; kicker: ReactNode; title: string; body: string; cta: ReactNode; label: string }) {
  return (
    <section className="ta-sec" aria-label={label}>
      <div className="ta-split">
        <div className="ta-split__media">{media}</div>
        <div className="ta-split__text">
          {kicker ? <p className="ta-split__kicker">{kicker}</p> : null}
          <h2>{title}</h2>
          <p className="ta-split__body">{body}</p>
          {cta}
        </div>
      </div>
    </section>
  );
}

export function PartnerPromo({ content }: { content: PromoSection }) {
  // agents are partners already
  if (useIsAgent()) return null;
  return (
    <Split
      label="Aapka Partner programme"
      media={<img src={content.image} alt="" loading="lazy" />}
      kicker={
        <>
          <Sun aria-hidden="true" />
          {content.kicker}
        </>
      }
      title={content.title}
      body={content.body}
      cta={
        <Link href={content.buttonHref} className="ta-btn ta-btn--dark ta-btn--lg">
          {content.buttonLabel}
        </Link>
      }
    />
  );
}

export function Promo({ content }: { content: PromoSection }) {
  const external = /^https?:\/\//.test(content.buttonHref);
  return (
    <Split
      label={content.title}
      media={<img src={content.image} alt="" loading="lazy" />}
      kicker={content.kicker}
      title={content.title}
      body={content.body}
      cta={
        content.buttonLabel ? (
          external ? (
            <a href={content.buttonHref} target="_blank" rel="noopener noreferrer" className="ta-btn ta-btn--dark ta-btn--lg">
              {content.buttonLabel}
            </a>
          ) : (
            <Link href={content.buttonHref} className="ta-btn ta-btn--dark ta-btn--lg">
              {content.buttonLabel}
            </Link>
          )
        ) : null
      }
    />
  );
}

const STORY = { id: 'DeEDL7XI3xJ', title: 'Dubai Holiday Trip from Gujarat' };

/* the reel only loads once the card is half on screen */
function StoryVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState<string | undefined>();
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSrc(`/videos/stories/${STORY.id}.mp4`);
          el.play().catch(() => {});
        } else el.pause();
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <video ref={ref} src={src} poster={`/images/insta-stories/${STORY.id}.jpg`} muted loop playsInline autoPlay aria-label={STORY.title} />;
}

export function StoriesPromo({ content }: { content: StoriesSection }) {
  return (
    <Split
      label="Traveller stories"
      media={<StoryVideo />}
      kicker={
        <>
          <Instagram aria-hidden="true" />
          On Instagram <a href="https://www.instagram.com/aapkatourism/" target="_blank" rel="noopener noreferrer">@aapkatourism</a>
        </>
      }
      title={content.title}
      body={content.body}
      cta={
        <a href={`https://www.instagram.com/reel/${STORY.id}/`} target="_blank" rel="noopener noreferrer" className="ta-btn ta-btn--dark ta-btn--lg">
          {content.buttonLabel}
        </a>
      }
    />
  );
}

export function TrustBand({ content }: { content: TrustSection }) {
  const { packages } = useCategoryPackages('offer-packages');
  const pkg = packages.find((p) => p.thumbnail_image);

  return (
    <section className="ta-awards" aria-label="Why Aapka Tourism">
      <div className="ta-awards__inner">
        <div className="ta-awards__text">
          <span className="ta-awards__badge" aria-hidden="true">
            <b>{content.badgeNumber}</b>
            {content.badgeLabel}
          </span>
          <h2>{content.title}</h2>
          <p>{content.body}</p>
          <Link href={content.buttonHref} className="ta-btn ta-btn--glow">
            {content.buttonLabel}
          </Link>
        </div>
        <div className="ta-awards__media">
          <img src={pkg?.thumbnail_image || '/images/package-3.jpg'} alt="" loading="lazy" />
          {pkg ? (
            <Link href={packageHref(pkg, 'Offer Packages')} className="ta-awards__tag">
              {pkg.package_name}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
