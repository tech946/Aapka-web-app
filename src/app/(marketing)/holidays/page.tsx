import { applyPageSeo } from '@/features/seo/server';
import type { Metadata } from 'next';
import { HydrationBoundary } from '@tanstack/react-query';
import HolidaysView from './HolidaysView';
import { prefetchHolidays } from './prefetch';
import '../Home/ex/ex.css';
import './ex/listing.css';

export const dynamic = 'force-dynamic';

const PAGE_METADATA: Metadata = {
  title: 'Holidays & Tours | Aapka Tourism',
  description:
    'All Aapka Tourism holidays in one place — offer packages, anydate packages, UAE tours, Marina cruises and limited time deals. Filter by type, budget, duration and more.',
};

export function generateMetadata(): Promise<Metadata> {
  return applyPageSeo(PAGE_METADATA);
}

export default async function HolidaysPage() {
  const state = await prefetchHolidays();
  return (
    <HydrationBoundary state={state}>
      <HolidaysView />
    </HydrationBoundary>
  );
}
