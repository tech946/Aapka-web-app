'use client';

import Image from 'next/image';
import Link from 'next/link';
import './home.css';

const categoryCards = [
  {
    id: 1,
    image: '/images/blog-1.png',
    alt: 'Offer Packages',
    text: 'Offer Packages',
    url: '/category/offer-packages',
    availabilityColor: 'yellow',
  },
  {
    id: 2,
    image: '/images/package-2.jpg',
    alt: 'Dubai Tours',
    text: 'Dubai Tours',
    url: '/category/tours',
    availabilityColor: 'teal',
  },
];

export default function PromotionalSection() {
  return (
    <div className='promotional-section'>
      {/* Top Spots Section */}
      <div className='top-spots-section'>
        <div className='container'>
          <div className='top-spots-grid'>
            {categoryCards.map(card => (
              <Link key={card.id} href={card.url} className='top-spot-card'>
                <div className='top-spot-image-wrapper'>
                  <Image
                    src={card.image}
                    alt={card.alt}
                    fill
                    className='top-spot-image'
                  />
                </div>
                <div
                  className={`top-spot-availability top-spot-availability-${card.availabilityColor}`}
                >
                  {card.text}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Promotional Banner */}
      <div className='container'>
        <div className='promotional-banner'>
          <div className='promotional-banner-background'>
            <Image
              src='/images/about-hero.jpg'
              alt='Travel destination'
              fill
              className='promotional-banner-image'
              priority
            />
          </div>
          <div className='promotional-banner-content'>
            <div className='promotional-banner-text-box'>
              <h2 className='promotional-banner-title'>
                Aapka Tourism now offers a
                <br />
                Best Price Guarantee.
              </h2>
              <p className='promotional-banner-description'>
                If you find a lower price elsewhere, we'll
                <br />
                match it and give you an additional discount.
              </p>
              <Link href='/' className='promotional-banner-button'>
                Book with confidence
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
