import { useCallback, useEffect, useMemo, useState } from 'react';
import { ALL_TYPES, LIMITED_DEALS, type HolidayType } from '@/config/holiday-types';
import type { ListingItem } from '@/components/site/listing/listing-data';
import { FACETS, SINGLE_OPTION_FACETS, type FacetKey, type FacetPicks, type LiveFacet } from '@/components/site/listing/listing-facets';
import { PAGE_SIZE } from './content';

export type PriceRange = [number, number];

export type ListingPreview = { facets: LiveFacet[]; count: number; bounds: PriceRange | null };

const HIDDEN_FACETS: FacetKey[] = ['budget'];

function baseFor(items: ListingItem[], types: HolidayType[], key: string): ListingItem[] {
  if (key === LIMITED_DEALS.key) return items.filter((i) => i.inDeal);
  const type = types.find((t) => t.key === key);
  return type ? items.filter((i) => i.typeKey === type.key) : items;
}

function defsFor(base: ListingItem[]): LiveFacet[] {
  const defs: LiveFacet[] = FACETS.filter((f) => !HIDDEN_FACETS.includes(f.key)).map((f) => {
    const counts: Record<string, number> = {};
    f.options.forEach((o) => (counts[o.value] = base.filter(o.test).length));
    return { ...f, options: f.options.filter((o) => counts[o.value] > 0), counts };
  });
  return defs.filter((f) => f.options.length > (SINGLE_OPTION_FACETS.includes(f.key) ? 0 : 1));
}

export function boundsFor(base: ListingItem[]): PriceRange | null {
  const prices = base.map((i) => i.price).filter((p): p is number => p != null);
  if (!prices.length) return null;
  return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))];
}

function filterBy(base: ListingItem[], defs: LiveFacet[], picks: FacetPicks, range: PriceRange | null): ListingItem[] {
  return base.filter((i) => {
    if (range && (i.price == null || i.price < range[0] || i.price > range[1])) return false;
    return defs.every((def) => {
      const picked = picks[def.key];
      if (!picked?.length) return true;
      const tests = def.options.filter((o) => picked.includes(o.value));
      if (!tests.length) return true;
      return def.key === 'incl' ? tests.every((o) => o.test(i)) : tests.some((o) => o.test(i));
    });
  });
}

export function useListing(types: HolidayType[], items: ListingItem[], active: string) {
  const [facets, setFacets] = useState<FacetPicks>({});
  const [range, setRange] = useState<PriceRange | null>(null);
  const [sort, setSort] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE_SIZE);

  useEffect(() => setShown(PAGE_SIZE), [active]);

  const dealCount = items.filter((i) => i.inDeal).length;
  const activeType = types.find((t) => t.key === active) ?? null;
  const isDeals = active === LIMITED_DEALS.key;
  const label = isDeals ? LIMITED_DEALS.label : (activeType?.label ?? ALL_TYPES.label);

  const chips = [
    { key: 'all', label: ALL_TYPES.label, count: items.length },
    ...types.map((t) => ({ key: t.key, label: t.label, count: items.filter((i) => i.typeKey === t.key).length })),
    ...(dealCount ? [{ key: LIMITED_DEALS.key, label: LIMITED_DEALS.label, count: dealCount }] : []),
  ];

  const base = useMemo(() => baseFor(items, types, active), [items, types, active]);
  const facetDefs = useMemo(() => defsFor(base), [base]);
  const bounds = useMemo(() => boundsFor(base), [base]);

  const list = useMemo(() => {
    const out = filterBy(base, facetDefs, facets, range);
    const price = (i: ListingItem) => i.price ?? Number.MAX_SAFE_INTEGER;
    if (sort === 'price-asc') out.sort((a, b) => price(a) - price(b));
    if (sort === 'price-desc') out.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    if (sort === 'dur-asc') out.sort((a, b) => a.nights - b.nights);
    if (sort === 'dur-desc') out.sort((a, b) => b.nights - a.nights);
    return out;
  }, [base, facets, facetDefs, range, sort]);

  const livePicks = facetDefs.reduce((n, f) => n + f.options.filter((o) => facets[f.key]?.includes(o.value)).length, 0) + (range ? 1 : 0);

  const preview = useCallback(
    (typeKey: string, picks: FacetPicks, draftRange: PriceRange | null): ListingPreview => {
      const draftBase = baseFor(items, types, typeKey);
      const defs = defsFor(draftBase);
      return { facets: defs, count: filterBy(draftBase, defs, picks, draftRange).length, bounds: boundsFor(draftBase) };
    },
    [items, types],
  );

  const toggleFacet = (key: FacetKey, value: string) => {
    setFacets((cur) => {
      const now = cur[key] ?? [];
      return { ...cur, [key]: now.includes(value) ? now.filter((v) => v !== value) : [...now, value] };
    });
    setShown(PAGE_SIZE);
  };

  const applyFacets = (picks: FacetPicks, nextRange: PriceRange | null = null) => {
    setFacets(picks);
    setRange(nextRange);
    setShown(PAGE_SIZE);
  };

  const changeSort = (value: string | null) => {
    setSort(value);
    setShown(PAGE_SIZE);
  };

  return {
    label,
    isDeals,
    chips,
    base,
    list,
    slice: list.slice(0, shown),
    hasMore: shown < list.length,
    showMore: () => setShown((n) => n + PAGE_SIZE),
    facets,
    facetDefs,
    bounds,
    range,
    clearRange: () => setRange(null),
    livePicks,
    sort,
    preview,
    toggleFacet,
    applyFacets,
    clearFacets: () => applyFacets({}),
    changeSort,
  };
}
