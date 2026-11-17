'use client';

import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useAgentStatus, useMarinaCruiseDinners, usePackageCategories } from '@/hooks/use-marketing-queries';
import { HOLIDAY_TYPES, typeForCategory, type HolidayType } from '@/config/holiday-types';
import { categorySlug } from '../site-config';
import { applyDeal, fromMarina, fromPackage, type ListingItem, type RawDeal, type RawPackage } from './listing-data';

/* Everything /holidays shows: every CRM category's listed packages, the
   Marina cruises, and the live limited-time deals folded in as a badge +
   filter on the package they belong to. */

const ALL = 100; // the whole catalogue fits one request per source
const CACHE = { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000, refetchOnWindowFocus: false };

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export interface HolidayData {
  /** types that have packages right now, in config order */
  types: HolidayType[];
  items: ListingItem[];
  loading: boolean;
}

export function useHolidayItems(): HolidayData {
  const { data: agentData } = useAgentStatus(true);
  const isAgent = !!agentData?.hasActiveSubscription;

  const { data: categoriesData = [], isLoading: categoriesLoading } = usePackageCategories(100);
  const categoryTypes = useMemo(
    () =>
      (categoriesData as Array<{ id?: string; category_id?: string; name?: string }>)
        .map((c, i) => {
          const name = String(c.name ?? '');
          return { id: String(c.id ?? c.category_id), type: typeForCategory(categorySlug(name), name, 50 + i) };
        })
        .filter((c) => c.id && c.id !== 'undefined'),
    [categoriesData],
  );

  // same query key as usePackagesByCategory, so the cache is shared
  const packageQueries = useQueries({
    queries: categoryTypes.map(({ id }) => ({
      queryKey: ['marketing', 'packages', id, ALL, 'active', 1, 'created_at_desc', true],
      queryFn: () =>
        getJson<{ data?: RawPackage[] }>(
          `/api/packages?category_id=${id}&limit=${ALL}&page=1&status=active&sort_by=created_at_desc&listing_page_only=true`,
        ),
      ...CACHE,
    })),
  });

  const { data: marinaData, isLoading: marinaLoading } = useMarinaCruiseDinners({ limit: ALL, listingPageOnly: true });

  const { data: deals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ['marketing', 'limited-time-deals', 'listing'],
    // the API already drops expired / inactive deals
    queryFn: () => getJson<{ data?: RawDeal[] }>('/api/limited-time-deals').then((j) => (j.data ?? []).filter((d) => d.package)),
    ...CACHE,
    staleTime: 60 * 1000,
  });

  const packagesReady = packageQueries.map((q) => q.data);
  const items = useMemo(() => {
    const out: ListingItem[] = [];
    categoryTypes.forEach(({ type }, i) => {
      (packagesReady[i]?.data ?? []).forEach((p) => out.push(fromPackage(p, type, isAgent)));
    });
    const marinaType = HOLIDAY_TYPES.find((t) => t.source.kind === 'marina');
    if (marinaType) ((marinaData?.data ?? []) as RawPackage[]).forEach((p) => out.push(fromMarina(p, marinaType)));

    // fold the live deals in; a deal whose package isn't listed anywhere
    // (e.g. hidden from listings) still gets its own card
    const offerType = HOLIDAY_TYPES.find((t) => t.key === 'offer-packages') ?? HOLIDAY_TYPES[0];
    deals.forEach((deal) => {
      const pkg = deal.package as RawPackage;
      const at = out.findIndex((it) => it.id === pkg.package_id);
      if (at >= 0) out[at] = applyDeal(out[at], deal, isAgent);
      else out.push(applyDeal(fromPackage(pkg, offerType, isAgent), deal, isAgent));
    });
    return out;
    // packagesReady changes identity every render; its contents drive this
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryTypes, JSON.stringify(packageQueries.map((q) => q.dataUpdatedAt)), marinaData, deals, isAgent]);

  const types = useMemo(() => {
    const all = [...categoryTypes.map((c) => c.type), ...HOLIDAY_TYPES.filter((t) => t.source.kind === 'marina')];
    return all.filter((t) => items.some((i) => i.typeKey === t.key)).sort((a, b) => a.order - b.order);
  }, [categoryTypes, items]);

  const loading = categoriesLoading || packageQueries.some((q) => q.isLoading) || marinaLoading || dealsLoading;
  return { types, items, loading };
}
