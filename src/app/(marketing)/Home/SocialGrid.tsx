'use client';

import { Instagram } from 'lucide-react';
import './home.css';

const socialItems = [
  {
    id: 'A',
    image: '/images/insta-reel-1.jpg',
    alt: 'Postcards from our little adventure in renotahoe. 💌 The perfect retreat for foo...',
  },
  {
    id: 'B',
    image: '/images/insta-reel-2.jpg',
    alt: 'Postcards from our little adventure in renotahoe. 💌 The perfect retreat for foo...',
  },
  {
    id: 'C',
    image: '/images/insta-reel-3.jpg',
    alt: 'Postcards from our little adventure in renotahoe. 💌 The perfect retreat for foo...',
  },
  {
    id: 'D',
    image: '/images/insta-reel-4.jpg',
    alt: 'BWB X standregolf - Behind the scenes from the filming session.',
  },
  {
    id: 'E',
    image: '/images/insta-reel-5.jpg',
    alt: 'BWB X standregolf collaborative shoot highlight moment.',
  },
  {
    id: 'F',
    image: '/images/insta-reel-6.jpg',
    alt: '🏆2025 Sunset Travel Awards: Superlative Cities announcement graphic.',
  },
  {
    id: 'G',
    image: '/images/insta-reel-7.jpg',
    alt: 'Climbing adventure during sunny Reno day.',
  },
  {
    id: 'H',
    image: '/images/insta-reel-8.jpg',
    alt: 'City skyline view with dramatic lighting over mountains.',
  },
  {
    id: 'I',
    image: '/images/insta-reel-9.jpg',
    alt: 'Rainy night ambience in the city streets.',
  },
  {
    id: 'J',
    image: '/images/insta-reel-10.jpg',
    alt: 'Stage setup for Battle Born event lit in red and blue.',
  },
  {
    id: 'K',
    image: '/images/insta-reel-11.jpg',
    alt: 'Country weekend with horses and outdoor fun.',
  },
  {
    id: 'L',
    image: '/images/insta-reel-12.jpg',
    alt: 'Reno-Tahoe itinerary featuring top local favorites.',
  },
  {
    id: 'M',
    image: '/images/insta-reel-13.jpg',
    alt: 'Scenic aerial photo of mountainous lakes.',
  },
  {
    id: 'N',
    image: '/images/insta-reel-14.jpg',
    alt: 'Horseback adventure with cowboy vibes.',
  },
];

export default function SocialGrid() {
  return (
    <section className='insta_grid_section'>
      <div className='insta_grid'>
        {socialItems.map((item, index) => (
          <button
            key={item.id}
            type='button'
            className='insta_grid__item'
            aria-label={item.alt}
          >
            <img
              src={item.image}
              alt={item.alt}
              className='insta_grid__image'
              loading='lazy'
            />
            <Instagram className='insta_grid__badge' size={20} />
          </button>
        ))}

        <div className='insta_grid__headline'>
          <span className='insta_grid__title'>#kamalpandeyvlogs</span>
          <a
            className='insta_grid__cta'
            href='https://www.instagram.com/kamalpandeyvlogs/'
            target='_blank'
            rel='noreferrer'
          >
            <Instagram size={20} />
            Follow Us
          </a>
        </div>
      </div>
    </section>
  );
}
