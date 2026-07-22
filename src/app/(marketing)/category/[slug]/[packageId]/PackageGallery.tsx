'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, MapPin } from 'lucide-react';
import { gsap } from 'gsap';
import './package-details.css';

interface PackageGalleryProps {
  images: string[];
  packageName: string;
}

export default function PackageGallery({ images, packageName }: PackageGalleryProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxSlide, setLightboxSlide] = useState(0);
  const gallerySliderRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lightboxSlideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lightboxRef = useRef<HTMLDivElement>(null);

  // GSAP animation for slide transitions - Simple sliding animation
  const animateSlide = useCallback((newIndex: number) => {
    const currentSlideEl = slideRefs.current[currentSlide];
    const newSlideEl = slideRefs.current[newIndex];
    
    if (!currentSlideEl || !newSlideEl) {
      setCurrentSlide(newIndex);
      return;
    }

    const isNext = newIndex > currentSlide;
    const direction = isNext ? 1 : -1;

    // Set new slide position before animation
    newSlideEl.style.zIndex = '2';
    gsap.set(newSlideEl, { x: `${direction * 100}%` });

    // Animate both slides simultaneously
    gsap.to(currentSlideEl, {
      x: `${direction * -100}%`,
      duration: 0.4,
      ease: 'power2.inOut',
      onComplete: () => {
        gsap.set(currentSlideEl, { x: '0%', zIndex: '0' });
      },
    });

    gsap.to(newSlideEl, {
      x: '0%',
      duration: 0.4,
      ease: 'power2.inOut',
      onComplete: () => {
        newSlideEl.style.zIndex = '1';
      },
    });

    setCurrentSlide(newIndex);
  }, [currentSlide]);

  // Lightbox slide animation - Modern slide with scale
  const animateLightboxSlide = useCallback((newIndex: number) => {
    const currentSlideEl = lightboxSlideRefs.current[lightboxSlide];
    const newSlideEl = lightboxSlideRefs.current[newIndex];
    
    if (!currentSlideEl || !newSlideEl) {
      setLightboxSlide(newIndex);
      return;
    }

    const isNext = newIndex > lightboxSlide;
    const direction = isNext ? 1 : -1;

    // Animate out current slide - slide out with scale down
    gsap.to(currentSlideEl, {
      opacity: 0,
      x: direction * 100,
      scale: 0.9,
      duration: 0.5,
      ease: 'power3.inOut',
      onComplete: () => {
        currentSlideEl.style.zIndex = '0';
        currentSlideEl.style.transform = 'translateX(0) scale(1)';
      },
    });

    // Animate in new slide - slide in from opposite side with scale up
    newSlideEl.style.zIndex = '1';
    newSlideEl.style.transform = `translateX(${direction * -100}px) scale(0.9)`;
    
    gsap.fromTo(
      newSlideEl,
      { 
        opacity: 0,
        x: direction * -100,
        scale: 0.9,
      },
      {
        opacity: 1,
        x: 0,
        scale: 1,
        duration: 0.5,
        ease: 'power3.out',
      }
    );

    setLightboxSlide(newIndex);
  }, [lightboxSlide]);

  // Open lightbox
  const openLightbox = useCallback((index: number) => {
    setLightboxSlide(index);
    setLightboxOpen(true);
    // Animate lightbox in
    if (lightboxRef.current) {
      gsap.fromTo(
        lightboxRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, []);

  // Close lightbox
  const closeLightbox = useCallback(() => {
    if (lightboxRef.current) {
      gsap.to(lightboxRef.current, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          setLightboxOpen(false);
        },
      });
    } else {
      setLightboxOpen(false);
    }
  }, []);

  // Handle keyboard navigation in lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        if (images.length > 1) {
          const newIndex = lightboxSlide === 0 ? images.length - 1 : lightboxSlide - 1;
          animateLightboxSlide(newIndex);
        }
      } else if (e.key === 'ArrowRight') {
        if (images.length > 1) {
          const newIndex = lightboxSlide === images.length - 1 ? 0 : lightboxSlide + 1;
          animateLightboxSlide(newIndex);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, lightboxSlide, images.length, animateLightboxSlide, closeLightbox]);

  // Auto-play slider (optional - can be enabled/disabled)
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      const newIndex = currentSlide === images.length - 1 ? 0 : currentSlide + 1;
      animateSlide(newIndex);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [images.length, currentSlide, animateSlide]);

  return (
    <>
      {/* Gallery */}
      <div className='package-hero-gallery'>
        {images.length === 0 ? (
          <div className='package-hero-placeholder' style={{ display: 'flex' }}>
            <MapPin className='package-hero-icon' />
          </div>
        ) : (
          <div className='package-gallery-wrapper' ref={gallerySliderRef}>
            <div className='package-gallery-slider'>
              {images.map((image, index) => (
                <div
                  key={index}
                  ref={el => {
                    slideRefs.current[index] = el;
                  }}
                  className={`package-gallery-slide ${index === currentSlide ? 'active' : ''}`}
                  style={{
                    zIndex: index === currentSlide ? 1 : 0,
                    transform: index === currentSlide ? 'translateX(0)' : index < currentSlide ? 'translateX(-100%)' : 'translateX(100%)',
                  }}
                >
                  <img
                    src={image}
                    alt={`${packageName} - Image ${index + 1}`}
                    className='package-gallery-image'
                    onClick={() => openLightbox(index)}
                    onError={e => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className='package-gallery-image-overlay'>
                    <button
                      className='package-gallery-zoom-btn'
                      onClick={() => openLightbox(index)}
                      aria-label='View full size'
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 21-4.34-4.34"/><circle cx="11" cy="11" r="8"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  className='package-gallery-nav package-gallery-nav-prev'
                  onClick={() => {
                    const newIndex = currentSlide === 0 ? images.length - 1 : currentSlide - 1;
                    animateSlide(newIndex);
                  }}
                  aria-label='Previous image'
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M3.24951 11.25H20.7493V12.75H3.24951V11.25Z" fill="black"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M3.9996 12.75C7.5272 12.75 10.4097 9.64786 10.4097 6.33995V5.58995H8.9097V6.33995C8.9097 8.85153 6.667 11.25 3.9996 11.25H3.24951V12.75H3.9996Z" fill="black"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M3.9996 11.25C7.5272 11.25 10.4097 14.3521 10.4097 17.66V18.41H8.9097V17.66C8.9097 15.1485 6.667 12.75 3.9996 12.75H3.24951V11.25H3.9996Z" fill="black"/>
                  </svg>
                </button>
                <button
                  className='package-gallery-nav package-gallery-nav-next'
                  onClick={() => {
                    const newIndex = currentSlide === images.length - 1 ? 0 : currentSlide + 1;
                    animateSlide(newIndex);
                  }}
                  aria-label='Next image'
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M20.7505 11.25H3.2507V12.75H20.7505V11.25Z" fill="black"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M20.0004 12.75C16.4728 12.75 13.5903 9.64786 13.5903 6.33995V5.58995H15.0903V6.33995C15.0903 8.85153 17.333 11.25 20.0004 11.25H20.7505V12.75H20.0004Z" fill="black"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M20.0004 11.25C16.4728 11.25 13.5903 14.3521 13.5903 17.66V18.41H15.0903V17.66C15.0903 15.1485 17.333 12.75 20.0004 12.75H20.7505V11.25H20.0004Z" fill="black"/>
                  </svg>
                </button>
                
                {/* Dots Indicator */}
                <div className='package-gallery-dots'>
                  {images.map((_, index) => (
                    <button
                      key={index}
                      className={`package-gallery-dot ${index === currentSlide ? 'active' : ''}`}
                      onClick={() => animateSlide(index)}
                      aria-label={`Go to image ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && images.length > 0 && (
        <div
          className='package-lightbox'
          ref={lightboxRef}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeLightbox();
            }
          }}
        >
          <button
            className='package-lightbox-close'
            onClick={closeLightbox}
            aria-label='Close lightbox'
          >
            <X size={32} />
          </button>
          
          {images.length > 1 && (
            <>
              <button
                className='package-lightbox-nav package-lightbox-nav-prev'
                onClick={() => {
                  const newIndex = lightboxSlide === 0 ? images.length - 1 : lightboxSlide - 1;
                  animateLightboxSlide(newIndex);
                }}
                aria-label='Previous image'
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M3.24951 11.25H20.7493V12.75H3.24951V11.25Z" fill="black"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M3.9996 12.75C7.5272 12.75 10.4097 9.64786 10.4097 6.33995V5.58995H8.9097V6.33995C8.9097 8.85153 6.667 11.25 3.9996 11.25H3.24951V12.75H3.9996Z" fill="black"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M3.9996 11.25C7.5272 11.25 10.4097 14.3521 10.4097 17.66V18.41H8.9097V17.66C8.9097 15.1485 6.667 12.75 3.9996 12.75H3.24951V11.25H3.9996Z" fill="black"/>
                </svg>
              </button>
              <button
                className='package-lightbox-nav package-lightbox-nav-next'
                onClick={() => {
                  const newIndex = lightboxSlide === images.length - 1 ? 0 : lightboxSlide + 1;
                  animateLightboxSlide(newIndex);
                }}
                aria-label='Next image'
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M20.7505 11.25H3.2507V12.75H20.7505V11.25Z" fill="black"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M20.0004 12.75C16.4728 12.75 13.5903 9.64786 13.5903 6.33995V5.58995H15.0903V6.33995C15.0903 8.85153 17.333 11.25 20.0004 11.25H20.7505V12.75H20.0004Z" fill="black"/>
                  <path fillRule="evenodd" clipRule="evenodd" d="M20.0004 11.25C16.4728 11.25 13.5903 14.3521 13.5903 17.66V18.41H15.0903V17.66C15.0903 15.1485 17.333 12.75 20.0004 12.75H20.7505V11.25H20.0004Z" fill="black"/>
                </svg>
              </button>
              
              <div className='package-lightbox-counter'>
                {lightboxSlide + 1} / {images.length}
              </div>
            </>
          )}
          
          <div className='package-lightbox-content'>
            {images.map((image, index) => (
              <div
                key={index}
                ref={el => {
                  lightboxSlideRefs.current[index] = el;
                }}
                className={`package-lightbox-slide ${index === lightboxSlide ? 'active' : ''}`}
                style={{
                  opacity: index === lightboxSlide ? 1 : 0,
                  zIndex: index === lightboxSlide ? 1 : 0,
                }}
              >
                <img
                  src={image}
                  alt={`${packageName} - Image ${index + 1}`}
                  className='package-lightbox-image'
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
