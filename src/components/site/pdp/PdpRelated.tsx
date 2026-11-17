'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { HOLIDAY_TYPES, LIMITED_DEALS, holidaysHref, typeForCategory } from '@/config/holiday-types';
import type { ListingItem } from '../listing/listing-data';
import { useHolidayItems } from '../listing/use-holiday-items';

const MARINA = HOLIDAY_TYPES.find((t) => t.source.kind === 'marina');

export interface RelatedItem {
  id: string;
  href: string;
  img?: string | null;
  title: string;
  meta: string[];
  price: string;
}

export interface PdpPlace {
  typeLabel: string;
  typeHref: string;
  /** "offer-packages", "marina", "deals" */
  source: string;
}

export function usePdpPlace(): PdpPlace {
  const pathname = usePathname() || '';
  const cat = pathname.match(/^\/category\/([^/]+)\//);
  if (cat) {
    const t = typeForCategory(cat[1], cat[1].replace(/-/g, ' '));
    return { typeLabel: t.label, typeHref: holidaysHref(t.key), source: cat[1] };
  }
  if (pathname.startsWith('/marina-cruise-dinner')) {
    return { typeLabel: MARINA?.label ?? 'Marina Cruise', typeHref: holidaysHref(MARINA?.key ?? 'marina-cruise'), source: 'marina' };
  }
  return { typeLabel: LIMITED_DEALS.label, typeHref: holidaysHref(LIMITED_DEALS.key), source: 'deals' };
}

const MAX_ITEMS = 8;

function lastSegment(path: string): string {
  return path.replace(/\/+$/, '').split('/').pop() ?? '';
}

export function useRelated(source: string): { items: ListingItem[]; ownCount: number; loading: boolean } {
  const pathname = usePathname() || '';
  const { items, loading } = useHolidayItems();
  return useMemo(() => {
    const here = lastSegment(pathname);
    const isOwn = (i: ListingItem) =>
      source === 'deals' ? i.inDeal : source === 'marina' ? i.href.startsWith('/marina-cruise-dinner/') : i.href.startsWith(`/category/${source}/`);
    const rest = items.filter((i) => i.href !== pathname && lastSegment(i.href) !== here);
    const own = rest.filter(isOwn);
    const others = rest.filter((i) => !isOwn(i));
    return { items: [...own, ...others].slice(0, MAX_ITEMS), ownCount: own.length, loading };
  }, [items, loading, pathname, source]);
}
