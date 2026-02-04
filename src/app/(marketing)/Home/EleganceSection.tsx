'use client';

import Image from 'next/image';
import Link from 'next/link';
import PackageSliderArrowRight from '@/components/icons/PackageSliderArrowRight';
import './home.css';

export default function EleganceSection() {
  return (
    <section className='elegance-section'>
      <div className='container'>
        {/* Header Text */}
        <div className='elegance-header'>
          <h2 className='elegance-header-text'>
            EVERY DESTINATION WE OFFER IS CURATED TO DELIVER EXCEPTIONAL JOURNEYS
          </h2>
        </div>

        {/* Two Column Layout */}
        <div className='elegance-content'>
          {/* Left Column - Large Image */}
          <div className='elegance-image-large'>
            <Image
              src='/images/about-section-1.jpg'
              alt='Travel destination'
              fill
              className='elegance-image'
              priority
            />
          </div>

          {/* Right Column - Text and Small Image */}
          <div className='elegance-right-column'>
            <div className='elegance-text-block'>
              <h3 className='elegance-subtitle'>UNFORGETTABLE TRAVEL EXPERIENCES</h3>
              <p className='elegance-description'>
                Whether you're seeking a tranquil escape or an adventurous
                exploration, we ensure every moment of your journey feels
                exceptional, carefully curated with attention to the finest
                details and authentic experiences.
              </p>
              <Link href='/category/offer-packages' className='elegance-button'>
                <span>Explore Packages</span>
                <PackageSliderArrowRight size={20} className='elegance-btn-arrow' />
              </Link>
            </div>
            <div className='elegance-image-small'>
              <Image
                src='/images/about-section-2.jpg'
                alt='Travel experience'
                fill
                className='elegance-image'
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
