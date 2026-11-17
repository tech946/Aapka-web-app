'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDaysIso, isoToday } from '@/components/site/ui/Calendar';
import { getAnyDateEarliestBookable } from '@/lib/anydate-availability';
import { usesBookingSlotsByName, usesFlexibleDatePackagesByName } from '@/lib/package-config';
import { generateShortSlug } from '@/lib/utils';
import { categorySlug } from '@/components/site/site-config';
import { priceLabel, useCategoryPackages, useHomeCategories, useIsAgent, type HomePackage } from '../../home-data';

/* The homepage booking search (category → package → date → travellers →
   package page) as state + actions, with no markup. HeroSearch owns one
   and HolidaySearchSheet draws it. */

export interface Pax {
  adult: number;
  child: number;
  infant: number;
}

export const MIN_ADULTS = 2;

/**
 * How the date is picked for the selected category:
 *   list      fixed departures (packagetypeid 1) — pick one of travel_dates
 *   flexible  any-date packages — the priced FlexibleDateCalendar
 *   calendar  everything else — a plain calendar from `minDate`
 */
export type DateMode = 'list' | 'flexible' | 'calendar';

function travelDates(pkg: HomePackage | null): string[] {
  return (pkg?.travel_dates ?? []).map((d) => (typeof d === 'string' ? d : d.value)).filter(Boolean);
}

export function useHolidaySearch() {
  const router = useRouter();
  const isAgent = useIsAgent();
  const { categories } = useHomeCategories();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [packageId, setPackageId] = useState('');
  const [date, setDate] = useState('');
  const [flexMonth, setFlexMonth] = useState(() => new Date());
  const [pax, setPax] = useState<Pax>({ adult: MIN_ADULTS, child: 0, infant: 0 });

  const category = categories.find((c) => c.id === categoryId) ?? categories[0] ?? null;
  const { packages, isLoading: packagesLoading } = useCategoryPackages(category ? categorySlug(category.name) : null, 100);
  const pkg = packages.find((p) => p.package_id === packageId) ?? null;

  const isFlexible = !!category && usesFlexibleDatePackagesByName(category.name);
  const isTour = !!category && usesBookingSlotsByName(category.name);
  const dateMode: DateMode = category?.packagetypeid === 1 ? 'list' : isFlexible ? 'flexible' : 'calendar';
  // tours can't be booked for today or tomorrow
  const minDate = isTour ? addDaysIso(isoToday(), 2) : isoToday();
  const dates = travelDates(pkg);

  const packageOptions = useMemo(
    () => packages.map((p) => ({ value: p.package_id, label: p.package_name, hint: priceLabel(p, isAgent) })),
    [packages, isAgent],
  );

  function pickCategory(id: string) {
    setCategoryId(id);
    setPackageId('');
    setDate('');
  }

  function pickPackage(id: string) {
    setPackageId(id);
    setDate('');
    const next = packages.find((p) => p.package_id === id);
    // any-date packages open on the month holding the first bookable day
    if (isFlexible && next) {
      const first = getAnyDateEarliestBookable(next.start_date ?? null);
      setFlexMonth(new Date(first.getFullYear(), first.getMonth(), 1));
    }
  }

  function stepPax(key: keyof Pax, delta: number) {
    setPax((p) => {
      const value = p[key] + delta;
      if (value < (key === 'adult' ? MIN_ADULTS : 0)) return p;
      return { ...p, [key]: value };
    });
  }

  function search() {
    if (!pkg || !category) return;
    const slug = generateShortSlug(pkg.package_name, pkg.package_id, pkg.package_days, pkg.package_nights);
    const q = new URLSearchParams();
    if (date) q.set('date', date);
    if (pax.adult > 0) q.set('adults', String(pax.adult));
    if (pax.child > 0) q.set('children', String(pax.child));
    if (pax.infant > 0) q.set('infants', String(pax.infant));
    const qs = q.toString();
    router.push(`/category/${categorySlug(category.name)}/${slug}${qs ? `?${qs}` : ''}`);
  }

  return {
    isAgent,
    categories,
    category,
    pickCategory,
    packages,
    packagesLoading,
    packageOptions,
    pkg,
    pickPackage,
    date,
    setDate,
    dateMode,
    dates,
    minDate,
    flexMonth,
    setFlexMonth,
    pax,
    stepPax,
    canSearch: !!pkg,
    search,
  };
}

export type HolidaySearch = ReturnType<typeof useHolidaySearch>;
