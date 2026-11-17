'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useHolidayItems } from '@/components/site/listing/use-holiday-items';
import type { ListingItem } from '@/components/site/listing/listing-data';
import { cmsSection, cmsText } from '@/features/cms/preview/markers';
import { BlogCarousel } from '../BlogCarousel';

const MAX_TOURS = 6;

interface TourCard {
  id: string;
  href: string;
  name: string;
  img: string;
  duration: string;
}

const FALLBACK_TOURS: TourCard[] = [
  { id: 'sample-dubai-holiday', href: '/holidays', name: 'Dubai Highlights Holiday', img: '/images/package-3.jpg', duration: '4N/5D' },
  { id: 'sample-abu-dhabi', href: '/holidays', name: 'Dubai & Abu Dhabi Explorer', img: '/images/about-section-1.jpg', duration: '5N/6D' },
  {
    id: 'sample-marina-cruise',
    href: '/holidays?type=marina-cruise',
    name: 'Dubai Marina Dinner Cruise',
    img: '/images/package-2.jpg',
   
    duration: '2 hours',
  },
];

function fromListing(item: ListingItem): TourCard {
  return {
    id: item.id,
    href: item.href,
    name: item.name,
    img: item.img || '/images/package-1.png',
    duration: item.durationLabel,
  };
}

function Tour({ tour }: { tour: TourCard }) {
  return (
    <Link href={tour.href} className='bl-overlay'>
      <img src={tour.img} alt='' loading='lazy' />
      {tour.duration && <span className='bl-overlay__time'>{tour.duration}</span>}
      <span className='bl-overlay__text'>
        <span className='bl-overlay__title'>{tour.name}</span>
      </span>
    </Link>
  );
}

export function RecommendedTours({ title }: { title: string }) {
  const { items, loading } = useHolidayItems();

  const tours = useMemo(() => {
    const live = items.filter((i) => i.img).slice(0, MAX_TOURS).map(fromListing);
    return live.length ? live : FALLBACK_TOURS;
  }, [items]);

  return (
    <section className='bl-widget bl-widget--flush'>
      <h2 className='bl-widget__title bl-widget__title--underline' {...cmsSection('aside', 'Side column headings')} {...cmsText('aside.toursTitle')}>
        {title}
      </h2>
      {loading && items.length === 0 ? (
        <div className='bl-tour--skeleton' aria-busy='true' />
      ) : (
        <BlogCarousel label='Recommended tours' className='bl-overlay-slider'>
          {tours.map((tour) => (
            <Tour key={tour.id} tour={tour} />
          ))}
        </BlogCarousel>
      )}
    </section>
  );
}
