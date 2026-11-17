'use client';

import { useQuery } from '@tanstack/react-query';
import {
  useAgentStatus,
  useBlogs,
  useCategoriesWithPackages,
  useMarinaCruiseDinners,
  usePackagesByCategory,
} from '@/hooks/use-marketing-queries';
import { applyAgentDiscount, getAgentDiscountPercentage } from '@/lib/agent-discount';
import { isPackagePriceRevealingSoon } from '@/lib/package-pricing';
import { getMarinaRegistrationPrices, isMarinaRegistrationMode } from '@/lib/marina-cruise-config';
import { generateShortSlug, parseDateStringToLocal } from '@/lib/utils';
import { categoryHref, categorySlug } from '@/components/site/site-config';

/* Data layer for the redesigned homepage. Every section reads production
   data through the existing marketing hooks (React Query dedupes the
   requests, so several sections asking for the same category = one fetch). */

export interface HomePackage {
  package_id: string;
  package_name: string;
  package_price?: number | null;
  adult_price?: number | null;
  child_price?: number | null;
  infant_price?: number | null;
  solo_traveller_enabled?: boolean | null;
  solo_traveller_price?: number | null;
  package_days?: number | null;
  package_nights?: number | null;
  thumbnail_image?: string | null;
  overview?: string | null;
  package_description?: string | null;
  travel_dates?: Array<{ id: string; value: string } | string> | null;
  date_ranges?: Array<{ adultPrice?: number; isSoldOut?: boolean }> | null;
  start_date?: string | null;
  end_date?: string | null;
  discount_end_date?: string | null;
  agent_discount?: number | null;
  with_visa?: boolean | null;
  category_name?: string | null;
  active_deal?: { deal_adult_price?: number | null; deal_end_date?: string | null } | null;
  [key: string]: unknown;
}

export interface HomeCategory {
  id: string;
  name: string;
  description?: string | null;
  packagetypeid?: number | null;
}

/* ------------------------------------------------------------ formatting */

export function formatAed(n: number): string {
  return `AED ${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export function plainText(html?: string | null): string {
  return String(html ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** "4N / 5D", "5 Days" or '' — same rule as the old home sliders. */
export function durationLabel(pkg: HomePackage): string {
  const d = pkg.package_days ?? 0;
  const n = pkg.package_nights ?? (d > 0 ? d - 1 : 0);
  if (d > 0 && n > 0) return `${n}N / ${d}D`;
  if (d > 0) return `${d} Days`;
  if (n > 0) return `${n} Nights`;
  return '';
}

export function shortDate(iso?: string | null): string {
  if (!iso) return '';
  const d = parseDateStringToLocal(iso);
  if (!d) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/ (\d\d)$/, "'$1");
}

/* ------------------------------------------------------------ prices + links */

/** Lowest public per-adult price a traveller can book this package from. */
export function startingPrice(pkg: HomePackage): number | null {
  if (isPackagePriceRevealingSoon(pkg as never)) return null;
  const candidates: number[] = [];
  const add = (v: unknown) => {
    const n = Number(v);
    if (v != null && Number.isFinite(n) && n > 0) candidates.push(n);
  };
  add(pkg.active_deal?.deal_adult_price);
  (pkg.date_ranges ?? []).forEach((r) => !r.isSoldOut && add(r.adultPrice));
  add(pkg.adult_price);
  if (!candidates.length) add(pkg.package_price);
  if (pkg.solo_traveller_enabled) add(pkg.solo_traveller_price);
  return candidates.length ? Math.min(...candidates) : null;
}

/** "AED 1,650" with the viewer's agent discount applied, or the
    revealing-soon copy when the package has no price yet. */
export function priceLabel(pkg: HomePackage, isAgent: boolean): string {
  const p = startingPrice(pkg);
  if (p == null) return 'Price revealing soon';
  return formatAed(applyAgentDiscount(p, getAgentDiscountPercentage(pkg, isAgent)));
}

export function packageHref(pkg: HomePackage, categoryName?: string | null): string {
  const slug = generateShortSlug(pkg.package_name, pkg.package_id, pkg.package_days, pkg.package_nights);
  return `/category/${categorySlug(categoryName || pkg.category_name || '')}/${slug}`;
}

/** Marina cruises can run in registration mode with their own prices. */
export function marinaFromPrice(pkg: HomePackage): number | null {
  if (isMarinaRegistrationMode(pkg as never)) {
    const reg = getMarinaRegistrationPrices(pkg as never);
    return reg.adultPrice > 0 ? reg.adultPrice : null;
  }
  return startingPrice(pkg);
}

export { categoryHref };

/* ------------------------------------------------------------ hooks */

export function useIsAgent(): boolean {
  const { data } = useAgentStatus();
  return !!data?.hasActiveSubscription;
}

/** Categories that currently have live packages, in CRM order. */
export function useHomeCategories(): { categories: HomeCategory[]; isLoading: boolean } {
  const { data = [], isLoading } = useCategoriesWithPackages(100);
  const categories = (data as Array<Record<string, unknown>>).map((c) => ({
    id: String(c.category_id ?? c.id ?? c.categoryId),
    name: String(c.name ?? ''),
    description: (c.description as string) ?? null,
    packagetypeid: (c.packagetypeid as number) ?? null,
  }));
  return { categories, isLoading };
}

export function useCategoryPackages(slug: string | null | undefined, limit = 20) {
  const { data, isLoading } = usePackagesByCategory({ categorySlug: slug || null, limit, status: 'active' });
  const packages = ((data?.data ?? []) as unknown) as HomePackage[];
  return { packages, total: data?.total ?? packages.length, isLoading };
}

export function useAllPackages(limit = 100) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['marketing', 'packages', 'all', limit],
    queryFn: async () => {
      const res = await fetch(`/api/packages?limit=${limit}&page=1&status=active`, { credentials: 'include' });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const json = (await res.json()) as { data?: HomePackage[] };
      return json.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  return { packages: data, isLoading };
}

export function useMarinaPackages() {
  const { data, isLoading } = useMarinaCruiseDinners({ limit: 20 });
  return { packages: ((data?.data ?? []) as unknown) as HomePackage[], isLoading };
}

export interface HomeDeal {
  id: string;
  end_date: string;
  package?: HomePackage | null;
}

/** Live limited-time deals (the API already drops expired / inactive ones). */
export function useLimitedTimeDeals() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['marketing', 'limited-time-deals', 'home'],
    queryFn: async () => {
      const res = await fetch('/api/limited-time-deals', { credentials: 'include' });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const json = (await res.json()) as { data?: HomeDeal[] };
      return (json.data ?? []).filter((d) => d.package);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
  return { deals: data, isLoading };
}

export function dealHref(pkg: HomePackage): string {
  return `/limited-time-deals/${generateShortSlug(pkg.package_name, pkg.package_id, pkg.package_days ?? null, pkg.package_nights ?? null)}`;
}

export interface HomeBlog {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  featured_image?: string | null;
  published_at?: string | null;
  blog_categories?: { name?: string | null } | null;
}

export function useHomeBlogs(limit = 10) {
  const { data = [], isLoading } = useBlogs(limit);
  return { blogs: data as HomeBlog[], isLoading };
}
