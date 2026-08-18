'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { gsap } from 'gsap';
import { generateShortSlug } from '@/lib/utils';
import { isPackagePriceRevealingSoon } from '@/lib/package-pricing';
import { PackagePriceRevealingSoonLabel } from '@/components/marketing/PackagePriceRevealingSoonLabel/PackagePriceRevealingSoonLabel';
import { useSliderDrag } from '@/lib/use-slider-drag';
import {
  usePackagesByCategory,
  useAgentStatus,
} from '@/hooks/use-marketing-queries';
import { getAgentDiscountPercentage } from '@/lib/agent-discount';
import { AgentDiscountPrice } from '@/components/marketing/AgentDiscountPrice/AgentDiscountPrice';
import './home.css';

interface Package {
  package_id: string;
  package_name: string;
  package_price: number | null;
  adult_price?: number | null;
  child_price?: number | null;
  infant_price?: number | null;
  solo_traveller_price?: number | null;
  solo_traveller_enabled?: boolean | null;
  solo_traveller_only?: boolean | null;
  package_days?: number | null;
  package_nights?: number | null;
  thumbnail_image?: string | null;
  package_description?: string | null;
  overview?: string | null;
  holiday_description_html?: string | null;
  agent_discount?: number | null;
}

/** Matches the plain `toLocaleString()` output used across the home sliders. */
function formatSectionPrice(price: number): string {
  return `AED ${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function getPackageDescription(pkg: Package): string {
  const stripHtml = (s: string) =>
    s
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  if (pkg.overview?.trim()) return stripHtml(pkg.overview);
  if (pkg.package_description?.trim()) return stripHtml(pkg.package_description);
  if (pkg.holiday_description_html?.trim())
    return stripHtml(pkg.holiday_description_html);
  return '';
}

function getDurationLabel(pkg: Package): string {
  const d = pkg.package_days ?? 0;
  const n = pkg.package_nights ?? (d > 0 ? d - 1 : 0);
  if (d === 0 && n === 0) return '';
  if (d > 0 && n > 0) return `${d} Days · ${n} Nights`;
  if (d > 0) return `${d} Days`;
  return `${n} Nights`;
}

export default function OfferPackagesSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { data, isLoading: loading } = usePackagesByCategory({
    categorySlug: 'offer-packages',
    limit: 20,
    status: 'active',
  });
  const packages = ((data?.data ?? []) as unknown) as Package[];
  const { data: agentData } = useAgentStatus();
  const isSubscribedAgent = !!agentData?.hasActiveSubscription;
  const cardsRef = useRef<HTMLDivElement>(null);
  const [cardsPerView, setCardsPerView] = useState(3);

  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth < 768) setCardsPerView(1);
      else if (window.innerWidth < 1024) setCardsPerView(2);
      else setCardsPerView(3);
    };
    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  const totalSlides = Math.max(1, Math.ceil(packages.length / cardsPerView));
  const maxIndex = Math.max(0, (totalSlides - 1) * cardsPerView);
  const currentSlide =
    totalSlides <= 1 ? 0 : Math.floor(currentIndex / cardsPerView);

  useEffect(() => {
    if (currentIndex > maxIndex) setCurrentIndex(maxIndex);
  }, [maxIndex, currentIndex]);

  useEffect(() => {
    if (packages.length === 0 || !cardsRef.current) return;
    const cardWidthPercent = 100 / packages.length;
    const offset = -currentIndex * cardWidthPercent;
    gsap.to(cardsRef.current, {
      x: `${offset}%`,
      duration: 0.6,
      ease: 'power2.out',
    });
  }, [currentIndex, packages.length]);

  const goToSlide = (slideIndex: number) => {
    setCurrentIndex(Math.min(slideIndex * cardsPerView, maxIndex));
  };

  const sliderDrag = useSliderDrag({
    onSwipeLeft: () =>
      setCurrentIndex((p) => Math.min(maxIndex, p + cardsPerView)),
    onSwipeRight: () =>
      setCurrentIndex((p) => Math.max(0, p - cardsPerView)),
  });

  if (loading) {
    return (
      <section className='offer-packages-section'>
        <div className='container'>
          <div className='section-loading'>Loading offer packages...</div>
        </div>
      </section>
    );
  }

  if (packages.length === 0) return null;

  return (
    <section className='offer-packages-section'>
      <div className='container'>
        <header className='section-header-pill'>
          <div className='section-badge-pill'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              viewBox='0 0 16 16'
              fill='none'
            >
              <path
                d='M8 0L9.81019 6.18981L16 8L9.81019 9.81019L8 16L6.18981 9.81019L0 8L6.18981 6.18981L8 0Z'
                fill='currentColor'
              />
            </svg>
            <span> Offer Packages</span>
          </div>
          <h2 className='section-heading-pill'>
            Exclusive deals and add-ons for your perfect holiday.
          </h2>
        </header>

        <div className='section-slider-container'>
          <div
            className='section-slider-wrapper'
            onTouchStart={sliderDrag.onTouchStart}
            onTouchEnd={sliderDrag.onTouchEnd}
          >
            <div
              className={`section-cards-track ${packages.length < cardsPerView ? 'centered' : ''}`}
              ref={cardsRef}
              style={{
                width:
                  packages.length < cardsPerView
                    ? '100%'
                    : `${(packages.length / cardsPerView) * 100}%`,
                justifyContent:
                  packages.length < cardsPerView ? 'center' : 'flex-start',
              }}
            >
              {packages.map(pkg => {
                const packageSlug = generateShortSlug(
                  pkg.package_name,
                  pkg.package_id,
                  pkg.package_days,
                  pkg.package_nights
                );
                const url = `/category/offer-packages/${packageSlug}`;
                const revealing = isPackagePriceRevealingSoon(pkg);
                /* Solo-only packages are sold to a single traveller, so the
                   card shows the solo rate instead of the adult/child/infant
                   pills. */
                const soloOnly = Boolean(
                  pkg.solo_traveller_only && pkg.solo_traveller_enabled
                );
                const soloRate =
                  pkg.solo_traveller_price ??
                  pkg.adult_price ??
                  pkg.package_price;
                const hasAdult =
                  !soloOnly && pkg.adult_price != null && pkg.adult_price > 0;
                const hasChild =
                  !soloOnly && pkg.child_price != null && pkg.child_price > 0;
                const hasInfant =
                  !soloOnly && pkg.infant_price != null && pkg.infant_price > 0;
                const agentDiscount = getAgentDiscountPercentage(
                  pkg,
                  isSubscribedAgent
                );
                return (
                  <div
                    key={pkg.package_id}
                    className='section-card-wrapper'
                    style={{
                      flex:
                        packages.length < cardsPerView
                          ? `0 0 ${100 / cardsPerView}%`
                          : `0 0 ${100 / packages.length}%`,
                      maxWidth:
                        packages.length < cardsPerView
                          ? `${100 / cardsPerView}%`
                          : 'none',
                    }}
                  >
                    <Link href={url} className='section-tour-card'>
                      <div className='section-tour-card-image'>
                        <Image
                          src={pkg.thumbnail_image || '/images/package-1.png'}
                          alt={pkg.package_name}
                          fill
                          className='section-card-img'
                          sizes='(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
                        />
                      </div>
                      <div className='section-tour-card-body'>
                        <h3 className='section-tour-card-title'>
                          {pkg.package_name}
                        </h3>
                        {getDurationLabel(pkg) && (
                          <span className='section-tour-card-duration'>
                            {getDurationLabel(pkg)}
                          </span>
                        )}
                        {getPackageDescription(pkg) && (
                          <p className='section-tour-card-desc'>
                            {getPackageDescription(pkg)}
                          </p>
                        )}
                        <div className='section-tour-card-price-pills'>
                          {revealing ? (
                            <PackagePriceRevealingSoonLabel variant='pill' />
                          ) : (
                            <>
                              {agentDiscount > 0 && (
                                <span className='agent-discount-badge'>
                                  Agent Discount {agentDiscount}%
                                </span>
                              )}
                              {hasAdult && (
                                <span className='section-tour-card-price-pill'>
                                  Adult:{' '}
                                  <AgentDiscountPrice
                                    price={pkg.adult_price}
                                    percentage={agentDiscount}
                                    format={formatSectionPrice}
                                  />
                                </span>
                              )}
                              {hasChild && (
                                <span className='section-tour-card-price-pill'>
                                  Child:{' '}
                                  <AgentDiscountPrice
                                    price={pkg.child_price}
                                    percentage={agentDiscount}
                                    format={formatSectionPrice}
                                  />
                                </span>
                              )}
                              {hasInfant && (
                                <span className='section-tour-card-price-pill'>
                                  Infant:{' '}
                                  <AgentDiscountPrice
                                    price={pkg.infant_price}
                                    percentage={agentDiscount}
                                    format={formatSectionPrice}
                                  />
                                </span>
                              )}
                              {soloOnly && (
                                <span className='section-tour-card-price-pill'>
                                  Solo Traveller:{' '}
                                  <AgentDiscountPrice
                                    price={soloRate}
                                    percentage={agentDiscount}
                                    format={formatSectionPrice}
                                  />
                                </span>
                              )}
                              {!soloOnly && !hasAdult && !hasChild && !hasInfant && (
                                <span className='section-tour-card-price-pill'>
                                  <AgentDiscountPrice
                                    price={pkg.package_price}
                                    percentage={agentDiscount}
                                    format={formatSectionPrice}
                                  />
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        <div className='section-tour-card-footer'>
                          <span className='section-tour-card-cta'>
                            <span className='section-tour-card-cta-text'>
                              View Details
                            </span>
                            <span
                              className='section-tour-card-cta-circle'
                              aria-hidden
                            >
                              <svg
                                width='20'
                                height='20'
                                viewBox='0 0 24 24'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                                className='elegance-btn-arrow'
                                aria-hidden='true'
                                focusable='false'
                              >
                                <path
                                  fill-rule='evenodd'
                                  clip-rule='evenodd'
                                  d='M20.7505 11.25H3.2507V12.75H20.7505V11.25Z'
                                  fill='currentColor'
                                ></path>
                                <path
                                  fill-rule='evenodd'
                                  clip-rule='evenodd'
                                  d='M20.0004 12.75C16.4728 12.75 13.5903 9.64786 13.5903 6.33995V5.58995H15.0903V6.33995C15.0903 8.85153 17.333 11.25 20.0004 11.25H20.7505V12.75H20.0004Z'
                                  fill='currentColor'
                                ></path>
                                <path
                                  fill-rule='evenodd'
                                  clip-rule='evenodd'
                                  d='M20.0004 11.25C16.4728 11.25 13.5903 14.3521 13.5903 17.66V18.41H15.0903V17.66C15.0903 15.1485 17.333 12.75 20.0004 12.75H20.7505V11.25H20.0004Z'
                                  fill='currentColor'
                                ></path>
                              </svg>
                            </span>
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {totalSlides > 1 && (
          <div className='section-slider-dots'>
            {Array.from({ length: totalSlides }, (_, i) => (
              <button
                key={i}
                type='button'
                className={`section-slider-dot ${i === currentSlide ? 'active' : ''}`}
                onClick={() => goToSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}

        <div className='section-view-all'>
          <Link
            href='/category/offer-packages'
            className='section-explore-all-btn'
          >
            Explore All Package
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
}
