'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Instagram, ArrowRight } from 'lucide-react';
import { gsap } from 'gsap';
import './home.css';

const tourActivityImages = [
  {
    id: 1,
    src: '/images/insta-reel-1.jpg',
    alt: 'Travel adventure',
    w: 260,
    h: 380,
    offset: -8,
  },
  {
    id: 2,
    src: '/images/insta-reel-2.jpg',
    alt: 'Travel experience',
    w: 280,
    h: 340,
    offset: 12,
  },
  {
    id: 3,
    src: '/images/insta-reel-3.jpg',
    alt: 'Travel moment',
    w: 240,
    h: 400,
    offset: -15,
  },
  {
    id: 4,
    src: '/images/insta-reel-4.jpg',
    alt: 'Travel destination',
    w: 300,
    h: 360,
    offset: 8,
  },
  {
    id: 5,
    src: '/images/insta-reel-5.jpg',
    alt: 'Travel highlight',
    w: 260,
    h: 420,
    offset: -10,
  },
  {
    id: 6,
    src: '/images/insta-reel-6.jpg',
    alt: 'Travel adventure',
    w: 220,
    h: 350,
    offset: 15,
  },
  {
    id: 7,
    src: '/images/insta-reel-7.jpg',
    alt: 'Travel experience',
    w: 290,
    h: 390,
    offset: -5,
  },
  {
    id: 8,
    src: '/images/insta-reel-8.jpg',
    alt: 'Travel moment',
    w: 250,
    h: 370,
    offset: 10,
  },
  {
    id: 9,
    src: '/images/insta-reel-9.jpg',
    alt: 'Travel destination',
    w: 270,
    h: 340,
    offset: -12,
  },
  {
    id: 10,
    src: '/images/insta-reel-10.jpg',
    alt: 'Travel highlight',
    w: 240,
    h: 400,
    offset: 6,
  },
  {
    id: 11,
    src: '/images/insta-reel-11.jpg',
    alt: 'Travel adventure',
    w: 280,
    h: 360,
    offset: -8,
  },
  {
    id: 12,
    src: '/images/insta-reel-12.jpg',
    alt: 'Travel experience',
    w: 260,
    h: 385,
    offset: 14,
  },
  {
    id: 13,
    src: '/images/insta-reel-13.jpg',
    alt: 'Travel moment',
    w: 230,
    h: 410,
    offset: -6,
  },
  {
    id: 14,
    src: '/images/insta-reel-14.jpg',
    alt: 'Travel destination',
    w: 295,
    h: 350,
    offset: 11,
  },
];

const displayImages = [...tourActivityImages, ...tourActivityImages];

export default function TourActivitiesSection() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    gsap.to(track, {
      xPercent: -50,
      duration: 45,
      repeat: -1,
      ease: 'none',
    });
  }, []);

  return (
    <section className='tour-activities-section'>
      <div className='tour-activities-bg-pattern' aria-hidden='true' />
      <div className='tour-activities-container'>
        <div className='tour-activities-header'>
          <div className='tour-activities-title-pill'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='16'
              viewBox='0 0 16 16'
              fill='none'
              className='travelers-review-plus'
            >
              <path
                d='M8 0L9.81019 6.18981L16 8L9.81019 9.81019L8 16L6.18981 9.81019L0 8L6.18981 6.18981L8 0Z'
                fill='currentColor'
              ></path>
            </svg>
            <span>Our Tour Activities</span>
          </div>
          <h2 className='tour-activities-heading'>
            Whether you seek adventure, culture, or calm — we&apos;ve got the
            perfect experience for every kind of traveler.
          </h2>
        </div>
      </div>

      <div className='tour-activities-marquee-wrap'>
        <div className='tour-activities-marquee-track' ref={trackRef}>
          {displayImages.map((item, idx) => (
            <div
              key={`${item.id}-dup${idx}`}
              className='tour-activities-card'
              style={{
                width: item.w,
                height: item.h,
                transform: `translateY(${item.offset}px)`,
              }}
            >
              <Image
                src={item.src}
                alt={item.alt}
                width={item.w}
                height={item.h}
                className='tour-activities-card-image'
                sizes={`${item.w}px`}
              />
            </div>
          ))}
        </div>
      </div>

      <div className='tour-activities-cta-wrap'>
        <a
          href='https://www.instagram.com/kamalpandeyvlogs/'
          target='_blank'
          rel='noopener noreferrer'
          className='tour-activities-cta-btn'
        >
          <Instagram size={22} />
          See Our Journey
          <ArrowRight size={20} className="tour-activities-cta-arrow" />
        </a>
      </div>
    </section>
  );
}
