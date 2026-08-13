'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Building2, Plane, Star } from 'lucide-react';
import { format } from 'date-fns';
import { gsap } from 'gsap';
import { useDealsOfTheDay, useAgentStatus } from '@/hooks/use-marketing-queries';
import { getAgentDiscountPercentage } from '@/lib/agent-discount';
import { AgentDiscountPrice } from '@/components/marketing/AgentDiscountPrice/AgentDiscountPrice';
import './home.css';

interface DealPackage {
  package_id: string;
  package_name: string;
  package_description: string | null;
  package_days: number | null;
  package_nights: number | null;
  adult_price: number | null;
  child_price: number | null;
  infant_price: number | null;
  solo_traveller_price: number | null;
  agent_discount?: number | null;
  itinerary: Array<{ heading: string; desc: string }> | null;
  thumbnail_image: string | null;
  gallery: string[] | null;
  category_name: string;
}

interface Deal {
  id: string;
  package_id: string;
  deal_adult_price: number | null;
  deal_child_price: number | null;
  deal_infant_price: number | null;
  deal_solo_traveller_price: number | null;
  original_adult_price: number | null;
  original_child_price: number | null;
  original_infant_price: number | null;
  original_solo_traveller_price: number | null;
  start_date: string;
  end_date: string;
  package: DealPackage;
}

export default function DealsOfTheDaySection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const { data: dealsData = [], isLoading: loading } = useDealsOfTheDay();
  const deals = dealsData as unknown as Deal[];
  const { data: agentData } = useAgentStatus();
  const isSubscribedAgent = !!agentData?.hasActiveSubscription;

  // GSAP animation for slider
  useEffect(() => {
    if (deals.length === 0 || !cardsRef.current) return;

    const cards = cardsRef.current.children;
    if (cards.length === 0) return;

    const updateSlider = () => {
      if (!cardsRef.current) return;
      const cards = cardsRef.current.children;
      
      Array.from(cards).forEach((card, index) => {
        if (index === currentIndex) {
          gsap.to(card, {
            x: 0,
            opacity: 1,
            zIndex: 2,
            duration: 0.6,
            ease: 'power2.out',
          });
        } else {
          const offset = index < currentIndex ? -100 : 100;
          gsap.to(card, {
            x: `${offset}%`,
            opacity: 0,
            zIndex: 1,
            duration: 0.6,
            ease: 'power2.out',
          });
        }
      });
    };

    // Initial setup
    Array.from(cards).forEach((card, index) => {
      if (index === currentIndex) {
        gsap.set(card, { x: 0, opacity: 1, zIndex: 2 });
      } else {
        const offset = index < currentIndex ? -100 : 100;
        gsap.set(card, { x: `${offset}%`, opacity: 0, zIndex: 1 });
      }
    });

    updateSlider();
  }, [currentIndex, deals.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % deals.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + deals.length) % deals.length);
  };

  // Extract cities from itinerary
  const getItineraryCities = (itinerary: Array<{ heading: string; desc: string }> | null): string => {
    if (!itinerary || itinerary.length === 0) return '';
    
    const cities: string[] = [];
    const cityPatterns = [
      /Day\s+\d+[:\s-]+([^–\-\n]+)/i,
      /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    ];
    
    itinerary.forEach((item) => {
      if (item.heading) {
        const heading = item.heading.replace(/<[^>]*>/g, '').trim();
        
        // Try different patterns
        for (const pattern of cityPatterns) {
          const matches = heading.match(pattern);
          if (matches) {
            const city = (matches[1] || matches[0]).trim().split(/[–-]/)[0].trim();
            if (city && city.length > 2 && !cities.includes(city) && !city.match(/^\d+$/)) {
              cities.push(city);
              break;
            }
          }
        }
      }
    });
    
    // Limit to first 5 cities
    return cities.slice(0, 5).join(' · ');
  };

  // Format price
  const formatPrice = (price: number): string => {
    return `USD ${price.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  // Get deal price (prefer deal price, fallback to original)
  const getDealPrice = (deal: Deal): number | null => {
    return deal.deal_adult_price ?? deal.original_adult_price ?? deal.package.adult_price;
  };

  // Format date
  const formatDealDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMM');
    } catch {
      return '';
    }
  };

  // Get package slug from category name
  const getPackageSlug = (packageName: string): string => {
    return packageName.toLowerCase().replace(/\s+/g, '-');
  };

  // Get category slug
  const getCategorySlug = (categoryName: string): string => {
    return categoryName.toLowerCase().replace(/\s+/g, '-');
  };

  if (loading) {
    return (
      <section className='deals-of-the-day-section'>
        <div className='container'>
          <div className='deals-loading'>Loading deals...</div>
        </div>
      </section>
    );
  }

  if (deals.length === 0) {
    return null; // Don't show section if no deals
  }

  const currentDeal = deals[currentIndex];
  const dealPrice = getDealPrice(currentDeal);
  const itineraryCities = getItineraryCities(currentDeal.package.itinerary);
  const packageImage = currentDeal.package.thumbnail_image || 
    (currentDeal.package.gallery && currentDeal.package.gallery.length > 0 
      ? currentDeal.package.gallery[0] 
      : '/images/package-1.png');
  const categorySlug = getCategorySlug(currentDeal.package.category_name);
  const packageSlug = getPackageSlug(currentDeal.package.package_name);
  const packageUrl = `/category/${categorySlug}/${currentDeal.package.package_id}`;

  return (
    <section className='deals-of-the-day-section'>
      <div className='container'>
        <div className='deals-slider-container'>
          <div className='deals-slider-wrapper' ref={sliderRef}>
            <div className='deals-cards' ref={cardsRef}>
              {deals.map((deal, index) => {
                const dealPrice = getDealPrice(deal);
                const itineraryCities = getItineraryCities(deal.package.itinerary);
                const packageImage = deal.package.thumbnail_image || 
                  (deal.package.gallery && deal.package.gallery.length > 0 
                    ? deal.package.gallery[0] 
                    : '/images/package-1.png');
                const categorySlug = getCategorySlug(deal.package.category_name);
                const packageUrl = `/category/${categorySlug}/${deal.package.package_id}`;
                const agentDiscount = getAgentDiscountPercentage(
                  deal.package,
                  isSubscribedAgent
                );

                return (
                  <div key={deal.id} className='deal-card'>
                    <div className='deal-card-content'>
                      {/* Left side - Text content */}
                      <div className='deal-card-left'>
                        <div className='deal-card-overlay'></div>
                        <div className='deal-card-text'>
                          {/* Category */}
                          <div className='deal-category'>{deal.package.category_name.toUpperCase()}</div>

                          {/* Package Title */}
                          <h3 className='deal-title'>{deal.package.package_name}</h3>

                          {/* Itinerary Cities */}
                          {itineraryCities && (
                            <div className='deal-itinerary'>{itineraryCities}</div>
                          )}

                          {/* Price */}
                          <div className='deal-price-info'>
                            <Building2 className='deal-price-icon' size={18} />
                            <span className='deal-price-text'>
                              Joining price from{' '}
                              <AgentDiscountPrice
                                price={dealPrice}
                                percentage={agentDiscount}
                                format={formatPrice}
                              />
                            </span>
                          </div>

                          {/* Flight Info */}
                          {itineraryCities && (
                            <div className='deal-flight-info'>
                              <Plane className='deal-flight-icon' size={18} />
                              <div className='deal-flight-text'>
                                <div>Book your own flights and meet us in {itineraryCities.split(' · ')[0] || 'destination'}</div>
                                <div>— depart from {itineraryCities.split(' · ').pop() || 'destination'} after the trip.</div>
                              </div>
                            </div>
                          )}

                          {/* CTA Button */}
                          <Link href={packageUrl} className='deal-cta-button'>
                            Join the Tour
                          </Link>

                          {/* T&C */}
                          <div className='deal-tc'>*T&C Apply</div>
                        </div>
                      </div>

                      {/* Right side - Three Image Cards */}
                      <div className='deal-card-right'>
                        <div className='deal-images-grid'>
                          {(() => {
                            const galleryImages = deal.package.gallery && deal.package.gallery.length > 0 
                              ? deal.package.gallery.slice(0, 3)
                              : [];
                            
                            // Use gallery images if available, otherwise use thumbnail or placeholder
                            const images = galleryImages.length >= 3 
                              ? galleryImages
                              : galleryImages.length > 0
                              ? [...galleryImages, ...Array(3 - galleryImages.length).fill(deal.package.thumbnail_image || '/images/package-1.png')]
                              : [deal.package.thumbnail_image || '/images/package-1.png', '/images/package-1.png', '/images/package-1.png'];
                            
                            return images.map((img, imgIndex) => (
                              <div key={imgIndex} className='deal-image-card'>
                                <div className='deal-image-card-wrapper'>
                                  <Image
                                    src={img}
                                    alt={`${deal.package.package_name} - Image ${imgIndex + 1}`}
                                    fill
                                    className='deal-image-card-img'
                                    priority={index === currentIndex && imgIndex === 0}
                                  />
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          {deals.length > 1 && (
            <>
              <button
                className='deal-nav-button deal-nav-prev'
                onClick={prevSlide}
                aria-label='Previous deal'
              >
                <ChevronLeft size={24} />
              </button>
              <button
                className='deal-nav-button deal-nav-next'
                onClick={nextSlide}
                aria-label='Next deal'
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
