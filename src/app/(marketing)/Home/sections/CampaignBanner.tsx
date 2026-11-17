'use client';

import Link from 'next/link';
import { useTcSlider } from '@/components/site/useTcSlider';

/* Campaign banners, mid-page (they used to be the hero; the hero is now a
   video with the headline + search, see HomeHero / HeroPanel). The artwork has its
   copy baked in, so these stay a list and the section is desktop-only —
   the baked text is unreadable at phone width. Add a slide here and the
   arrows + dots appear on their own. */
const SLIDES = [
  {
    src: '/assets/images/home-banner.webp',
    href: '/travel-enquiry',
    alt: 'Aapka Tourism winter holidays — chase the aurora, cruise the coast, meet Santa Claus',
  },
];

export default function CampaignBanner() {
  const s = useTcSlider({ count: SLIDES.length, perView: 1, autoplay: 4500 });

  return (
    <div className="campaign_banner rn__section__gapTop">
      <div className="container">
        <div className="carousel-wrapper">
          <div className="tc-slider" {...s.rootProps}>
            <div className="tc-slider-track" style={s.trackStyle} {...s.trackProps}>
              {SLIDES.map((slide, i) => (
                <div className="tc-slide" style={s.slideStyle(i)} key={slide.src}>
                  <Link href={slide.href} className="campaign_banner__card">
                    <img src={slide.src} width="1832" height="858" alt={slide.alt} loading="lazy" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
          {!s.single && (
            <>
              <button type="button" className="custom-owl-prev" onClick={s.prev} disabled={!s.canPrev} aria-label="Previous banner">
                <img src="/assets/images/commonIcons/home-chevron-left.svg" alt="" />
              </button>
              <button type="button" className="custom-owl-next" onClick={s.next} disabled={!s.canNext} aria-label="Next banner">
                <img src="/assets/images/commonIcons/home-chevron-right.svg" alt="" />
              </button>
              <div className="swiper-pagination">
                {Array.from({ length: s.maxIndex + 1 }, (_, i) => (
                  <span key={i} className={i === s.index ? 'active' : ''} onClick={() => s.go(i)} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
