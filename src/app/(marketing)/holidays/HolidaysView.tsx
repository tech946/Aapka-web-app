'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useHolidayItems } from '@/components/site/listing/use-holiday-items';
import { LIMITED_DEALS, holidaysHref } from '@/config/holiday-types';
import ExHeader from '../Home/ex/ExHeader';
import { ExFooter } from '../Home/ex/ExSections';
import { EX_FONTS } from '../Home/ex/fonts';
import ExListing from './ex/ExListing';

export default function HolidaysView() {
  const router = useRouter();
  const params = useSearchParams();
  const { types, items, loading } = useHolidayItems();

  const requested = params.get('type') || 'all';
  const known = requested === 'all' || requested === LIMITED_DEALS.key || types.some((t) => t.key === requested);
  const active = loading || known ? requested : 'all';

  const onActiveChange = useCallback((key: string) => router.replace(holidaysHref(key), { scroll: false }), [router]);

  return (
    <div className={'desert-ember ex ' + EX_FONTS}>
      <ExHeader />
      <main>
        <ExListing types={types} items={items} loading={loading} active={active} onActiveChange={onActiveChange} />
      </main>
      <ExFooter />
    </div>
  );
}
