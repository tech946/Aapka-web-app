'use client';

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { useTcSlider } from '@/components/site/useTcSlider';
import {
  formatAed,
  marinaFromPrice,
  packageHref,
  plainText,
  priceLabel,
  useCategoryPackages,
  useHomeCategories,
  useIsAgent,
  useMarinaPackages,
} from '../home-data';

/* Design: "Thomas Cook Specials". Same grid; the live blocks (Marina price,
   Offer Packages slider, Flexible Dates copy) read production data and the
   rest link to Aapka's own services. The design's third row (Oman visa,
   Limited Time Deals, B2B) was dropped: the Explore tiles, the deals
   section and the footer already carry those links. */

const ARROW = '/assets/images/commonIcons/arrow-up-right.svg';
const ARROW_02 = '/assets/images/commonIcons/arrow-up-right-02.svg';

export default function Specials() {
  const isAgent = useIsAgent();
  const marina = useMarinaPackages();
  const offer = useCategoryPackages('offer-packages');
  const { categories } = useHomeCategories();
  const flexible = categories.find((c) => c.name === 'Flexible Date Packages');
  const offers = offer.packages.slice(0, 6);
  const s = useTcSlider({ count: offers.length, perView: 1, gap: 16 });

  const cruise = marina.packages[0];
  const cruiseFrom = cruise ? marinaFromPrice(cruise) : null;

  return (
    <div className="tc_specials rn__section__gapTop">
      <div className="container">
        <div className="row">
          <div className="col-inner">
            <div className="main_heading">
              <div>
                <h2>Aapka specials</h2>
              </div>
            </div>

            <div className="inner__gapTop">
              <div className="top_section">
                <Link href="/holidays?type=marina-cruise" className="festival_blck">
                  <div className="bg_img">
                    <img src="/assets/images/tcHolidays/tcHome/dubai.avif" alt="Dubai Marina skyline" title="Dubai Marina" loading="lazy" />
                  </div>
                  <div className="text_box">
                    <h4>{cruise?.package_name || 'Dubai Marina Dinner Cruise'}</h4>
                    <h6>Two hours on the water with dinner and skyline views</h6>
                    {cruiseFrom ? <span>Starting at {formatAed(cruiseFrom)}</span> : null}
                    <div className="btn">
                      View More
                      <img src={ARROW} alt="" />
                    </div>
                  </div>
                </Link>

                <div className="wildlife_slideData">
                  <div className="carousel-section">
                    <div className="carousel-wrapper owl-nav-wrap">
                      <div className="tc-slider" {...s.rootProps}>
                        <div className="tc-slider-track" style={s.trackStyle} {...s.trackProps}>
                          {offers.map((p, i) => (
                            <div className="tc-slide" style={s.slideStyle(i)} key={p.package_id}>
                              <div className="carousel-card">
                                <Link href={packageHref(p, 'Offer Packages')} className="carousel-image-link">
                                  <div
                                    className="carousel-image-wrapper poster_frame"
                                    style={{ '--poster': `url("${p.thumbnail_image || '/images/package-1.png'}")` } as CSSProperties}
                                  >
                                    <img src={p.thumbnail_image || '/images/package-1.png'} alt={p.package_name} title={p.package_name} className="img-fluid" loading="lazy" />
                                    <div className="carousel-caption-overlay">
                                      <h3>{p.package_name}</h3>
                                      <p className="subtext">Starting at {priceLabel(p, isAgent)}</p>
                                      <p className="package-id">View More</p>
                                    </div>
                                  </div>
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {!s.single && (
                        <>
                          <div className="swiper-pagination">
                            {Array.from({ length: s.maxIndex + 1 }, (_, i) => (
                              <span key={i} className={i === s.index ? 'active' : ''} onClick={() => s.go(i)} />
                            ))}
                          </div>
                          <button type="button" className="custom-owl-prev" onClick={s.prev} disabled={!s.canPrev} aria-label="Previous offer">
                            ❮
                          </button>
                          <button type="button" className="custom-owl-next" onClick={s.next} disabled={!s.canNext} aria-label="Next offer">
                            ❯
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bottom_section">
                <div className="video_container">
                  <Link href="/holidays?type=flexible-date-packages" className="festival_blck wide">
                    <div className="bg_img">
                      <img src="/assets/images/tcHolidays/holidaysLP/WhyThomasCook/why-thomas-ccok-bg.jpg" alt="Family travelling together" loading="lazy" />
                    </div>
                    <div className="text_box dark">
                      <h4>Flexible Date Packages</h4>
                      <h6>{plainText(flexible?.description) || 'Travel on your schedule — choose any date and we plan the rest.'}</h6>
                      <div className="btn">
                        View More
                        <img src={ARROW} alt="" />
                      </div>
                    </div>
                  </Link>
                </div>

                <Link href="/travel-enquiry" className="card_box gradient_card">
                  <div className="bg_img">
                    <img src="/assets/images/home-page-banners/2026/jan/build-your-own-Itinerary.avif" alt="" loading="lazy" />
                  </div>
                  <div className="text_box">
                    <h4>Build Your Own Itinerary!</h4>
                    <span>Tell us your dates, budget & must-sees — our experts plan the rest</span>
                    <div className="btn btn_circle" aria-hidden="true">
                      <img src={ARROW_02} alt="" />
                    </div>
                  </div>
                </Link>

                <Link href="/become-partner" className="card_box gradient_card">
                  <div className="bg_img">
                    <img src="/assets/images/domestic/2026/banners/buy-forex-and-earn-306x349.avif" alt="" loading="lazy" />
                  </div>
                  <div className="text_box">
                    <h4>Become a Partner & Earn</h4>
                    <span>Exclusive partner prices on every package</span>
                    <div className="btn btn_circle" aria-hidden="true">
                      <img src={ARROW_02} alt="" />
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
