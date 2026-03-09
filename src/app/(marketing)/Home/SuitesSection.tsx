'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { gsap } from 'gsap';
import PackageSliderArrowRight from '@/components/icons/PackageSliderArrowRight';
import { useCategoriesWithPackageCount } from '@/hooks/use-marketing-queries';
import './home.css';

// GSAP hover animation for buttons
const animateButtonHover = (element: HTMLElement, isEnter: boolean) => {
  const svgEl = element.querySelector('svg');
  if (isEnter) {
    gsap.to(element, {
      scale: 1.02,
      y: -2,
      duration: 0.3,
      ease: 'power2.out',
    });
    if (svgEl) {
      gsap.to(svgEl, { x: 4, duration: 0.3, ease: 'power2.out' });
    }
  } else {
    gsap.to(element, {
      scale: 1,
      y: 0,
      duration: 0.3,
      ease: 'power2.out',
    });
    if (svgEl) {
      gsap.to(svgEl, { x: 0, duration: 0.3, ease: 'power2.out' });
    }
  }
};

interface Category {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  packageCount: number;
}

export default function SuitesSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { data: categories = [], isLoading: loading } = useCategoriesWithPackageCount(100);
  const sliderRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [cardsPerView, setCardsPerView] = useState(3);

  // Handle responsive cards per view
  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth < 768) {
        setCardsPerView(1);
      } else if (window.innerWidth < 1024) {
        setCardsPerView(2);
      } else {
        setCardsPerView(3);
      }
    };

    updateCardsPerView();
    window.addEventListener('resize', updateCardsPerView);
    return () => window.removeEventListener('resize', updateCardsPerView);
  }, []);

  // Calculate max index based on actual items
  const maxIndex = Math.max(0, categories.length - cardsPerView);

  // Reset currentIndex if it exceeds maxIndex
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [maxIndex, currentIndex]);

  // GSAP animation for slider
  useEffect(() => {
    if (categories.length === 0 || !cardsRef.current) return;

    const updateSlider = () => {
      if (!cardsRef.current) return;
      
      // Calculate the percentage to move based on actual card count
      const totalCards = categories.length;
      const cardWidthPercent = 100 / totalCards;
      const offset = -currentIndex * cardWidthPercent;
      
      gsap.to(cardsRef.current, {
        x: `${offset}%`,
        duration: 0.6,
        ease: 'power2.out',
      });
    };

    updateSlider();
  }, [currentIndex, categories.length, cardsPerView]);

  const nextSlide = () => {
    if (currentIndex < maxIndex) {
      setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  // Get category URL
  const getCategoryUrl = (category: Category): string => {
    const slug = category.name.toLowerCase().replace(/\s+/g, '-');
    return `/category/${slug}`;
  };

  if (loading) {
    return (
      <section className='suites-section-new'>
        <div className='container'>
          <div className='suites-loading'>Loading categories...</div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className='suites-section-new'>
      <div className='container'>
        {/* Title */}
        <h2 className='suites-title-new'>All Inclusive Tour Packages</h2>

        {/* Slider */}
        <div className='suites-slider-container'>
          {/* Navigation - Left */}
          {categories.length > cardsPerView && (
            <button
              className={`suites-nav-btn suites-nav-prev ${currentIndex === 0 ? 'disabled' : ''}`}
              onClick={prevSlide}
              disabled={currentIndex === 0}
              aria-label='Previous'
            >
          <svg className="suites-btn-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M3.24951 11.25H20.7493V12.75H3.24951V11.25Z" fill="black"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M3.9996 12.75C7.5272 12.75 10.4097 9.64786 10.4097 6.33995V5.58995H8.9097V6.33995C8.9097 8.85153 6.667 11.25 3.9996 11.25H3.24951V12.75H3.9996Z" fill="black"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M3.9996 11.25C7.5272 11.25 10.4097 14.3521 10.4097 17.66V18.41H8.9097V17.66C8.9097 15.1485 6.667 12.75 3.9996 12.75H3.24951V11.25H3.9996Z" fill="black"></path></svg>
            </button>
          )}

          <div className='suites-slider-wrapper' ref={sliderRef}>
            <div 
              className={`suites-cards-track ${categories.length < cardsPerView ? 'centered' : ''}`}
              ref={cardsRef}
              style={{
                width: categories.length < cardsPerView 
                  ? '100%' 
                  : `${(categories.length / cardsPerView) * 100}%`,
                justifyContent: categories.length < cardsPerView ? 'center' : 'flex-start',
              }}
            >
              {categories.map((category) => {
                const categoryUrl = getCategoryUrl(category);
                const categoryImage = category.image || '/images/package-1.png';

                return (
                    <div 
                    key={category.id} 
                    className='suites-card-wrapper'
                    style={{
                      flex: categories.length < cardsPerView 
                        ? `0 0 ${100 / cardsPerView}%`
                        : `0 0 ${100 / categories.length}%`,
                      maxWidth: categories.length < cardsPerView ? `${100 / cardsPerView}%` : 'none',
                    }}
                  >
                    <div className='suites-card'>
                      {/* Image Section */}
                      <div className='suites-card-image'>
                        <div className='suites-image-single'>
                          <Image
                            src={categoryImage}
                            alt={category.name}
                            fill
                            className='suites-img'
                          />
                          {/* Package count badge */}
                          <div className='suites-package-count'>
                            {category.packageCount} {category.packageCount === 1 ? 'Package' : 'Packages'}
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className='suites-card-content'>
                        {/* Category Name */}
                        <h3 className='suites-card-title'>{category.name}</h3>

                        {/* Description */}
                        {category.description && (
                          <p className='suites-card-destinations'>
                            {category.description.slice(0, 80)}
                            {category.description.length > 80 ? '...' : ''}
                          </p>
                        )}

                        {/* Explore Button */}
                        <Link 
                          href={categoryUrl} 
                          className='suites-read-more'
                          onMouseEnter={(e) => animateButtonHover(e.currentTarget, true)}
                          onMouseLeave={(e) => animateButtonHover(e.currentTarget, false)}
                        >
                          <span>Explore Packages</span>
                          <PackageSliderArrowRight size={20} className='suites-btn-arrow' />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation - Right */}
          {categories.length > cardsPerView && (
            <button
              className={`suites-nav-btn suites-nav-next ${currentIndex >= maxIndex ? 'disabled' : ''}`}
              onClick={nextSlide}
              disabled={currentIndex >= maxIndex}
              aria-label='Next'
            >
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="suites-btn-arrow" aria-hidden="true" focusable="false"   ><path fill-rule="evenodd" clip-rule="evenodd" d="M20.7505 11.25H3.2507V12.75H20.7505V11.25Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M20.0004 12.75C16.4728 12.75 13.5903 9.64786 13.5903 6.33995V5.58995H15.0903V6.33995C15.0903 8.85153 17.333 11.25 20.0004 11.25H20.7505V12.75H20.0004Z" fill="currentColor"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M20.0004 11.25C16.4728 11.25 13.5903 14.3521 13.5903 17.66V18.41H15.0903V17.66C15.0903 15.1485 17.333 12.75 20.0004 12.75H20.7505V11.25H20.0004Z" fill="currentColor"></path></svg>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
