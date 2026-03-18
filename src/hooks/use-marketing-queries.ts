'use client';

import {
  useQuery,
  useQueries,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';

// Stale/cache config for marketing data - reduces 429 errors
const STALE_TIME = 5 * 60 * 1000; // 5 min
const CACHE_TIME = 10 * 60 * 1000; // 10 min

const defaultOptions = {
  staleTime: STALE_TIME,
  gcTime: CACHE_TIME,
  refetchOnWindowFocus: false,
  refetchOnMount: false,
} satisfies Omit<UseQueryOptions<unknown>, 'queryKey' | 'queryFn'>;

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: 'include', ...options });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json() as Promise<T>;
}

// --- Package Categories ---
const KEY_CATEGORIES = ['marketing', 'package-categories'] as const;

export function usePackageCategories(limit = 100) {
  return useQuery({
    queryKey: [...KEY_CATEGORIES, limit],
    queryFn: () =>
      fetcher<{ data: Array<Record<string, unknown>> }>(
        `/api/package-categories?limit=${limit}`
      ).then(r => r.data),
    ...defaultOptions,
  });
}

// --- Categories with package counts (each category count cached separately) ---
export function useCategoriesWithPackages(limit = 100) {
  const { data: categories = [], ...rest } = usePackageCategories(limit);
  const categoryIds = categories
    .map((c: Record<string, unknown>) => {
      const v = c.category_id ?? c.id ?? c.categoryId;
      return v != null ? String(v) : null;
    })
    .filter((id): id is string => !!id);

  const packageQueries = useQueries({
    queries: categoryIds.map(categoryId => ({
      queryKey: ['marketing', 'packages', 'count', categoryId],
      queryFn: () =>
        fetcher<{ total?: number }>(
          `/api/packages?category_id=${categoryId}&limit=1&status=active`
        ).then(r => (r.total ?? 0) > 0),
      ...defaultOptions,
    })),
  });

  const hasPackages = new Set(
    categoryIds.filter((_, i) => packageQueries[i]?.data === true)
  );
  const filtered = categories.filter((c: Record<string, unknown>) => {
    const id = c.category_id ?? c.id ?? c.categoryId;
    return id != null && hasPackages.has(String(id));
  });

  const isLoading =
    rest.isLoading ||
    packageQueries.some(q => q.isLoading || q.isFetching);
  const isError = rest.isError || packageQueries.some(q => q.isError);

  return {
    ...rest,
    data: filtered,
    categories,
    isLoading,
    isError,
  };
}

// --- Categories with package count (for SuitesSection etc.) ---
export function useCategoriesWithPackageCount(limit = 100) {
  const { data: categories = [], ...rest } = usePackageCategories(limit);
  const categoryIds = categories
    .map((c: Record<string, unknown>) => {
      const v = c.category_id ?? c.id ?? c.categoryId;
      return v != null ? String(v) : null;
    })
    .filter((id): id is string => !!id);

  const countQueries = useQueries({
    queries: categoryIds.map(catId => ({
      queryKey: ['marketing', 'packages', 'count', catId],
      queryFn: () =>
        fetcher<{ total?: number }>(
          `/api/packages?category_id=${catId}&limit=1&status=active`
        ).then(r => r.total ?? 0),
      ...defaultOptions,
    })),
  });

  const withCount = categories
    .map((c: Record<string, unknown>, i) => {
      const id = c.category_id ?? c.id ?? c.categoryId;
      const count = countQueries[i]?.data ?? 0;
      if (!id || count === 0) return null;
      return { ...c, id: String(id), packageCount: count };
    })
    .filter(Boolean);

  const isLoading =
    rest.isLoading || countQueries.some(q => q.isLoading || q.isFetching);
  const isError = rest.isError || countQueries.some(q => q.isError);

  return {
    ...rest,
    data: withCount,
    isLoading,
    isError,
  };
}

// --- Packages by category/slug ---
export function usePackagesByCategory(options: {
  categoryId?: string | null;
  categorySlug?: string | null;
  limit?: number;
  status?: string;
  page?: number;
  sort_by?: string;
}) {
  const { categoryId, categorySlug, limit = 100, status = 'active', page = 1, sort_by } = options;
  const params = new URLSearchParams();
  if (categoryId) params.set('category_id', categoryId);
  if (categorySlug) params.set('categorySlug', categorySlug);
  params.set('limit', String(limit));
  params.set('page', String(page));
  if (status) params.set('status', status);
  if (sort_by) params.set('sort_by', sort_by);

  return useQuery({
    queryKey: ['marketing', 'packages', categoryId ?? categorySlug ?? 'list', limit, status, page, sort_by],
    queryFn: () =>
      fetcher<{ data: Array<Record<string, unknown>>; total?: number }>(
        `/api/packages?${params.toString()}`
      ),
    enabled: !!(categoryId || categorySlug),
    ...defaultOptions,
  });
}

// --- Footer packages (offer + tours) ---
export function useFooterPackages() {
  const offer = useQuery({
    queryKey: ['marketing', 'packages', 'footer', 'offer-packages'],
    queryFn: () =>
      fetcher<{ data?: unknown[]; success?: boolean }>(
        '/api/packages?categorySlug=offer-packages&limit=4'
      ),
    ...defaultOptions,
  });
  const tours = useQuery({
    queryKey: ['marketing', 'packages', 'footer', 'uae-tours'],
    queryFn: () =>
      fetcher<{ data?: unknown[]; success?: boolean }>(
        '/api/packages?categorySlug=uae-tours&limit=7'
      ),
    ...defaultOptions,
  });

  return {
    offerPackages: offer.data?.data ?? (offer.data as { data?: unknown[] })?.data ?? [],
    tours: tours.data?.data ?? (tours.data as { data?: unknown[] })?.data ?? [],
    isLoading: offer.isLoading || tours.isLoading,
    isError: offer.isError || tours.isError,
  };
}

// --- Deals of the day ---
export function useDealsOfTheDay() {
  return useQuery({
    queryKey: ['marketing', 'deals-of-the-day'],
    queryFn: () =>
      fetcher<{ data?: unknown[] }>('/api/deals-of-the-day').then(r => r.data ?? []),
    ...defaultOptions,
  });
}

// --- Blogs ---
export function useBlogs(limit = 10) {
  return useQuery({
    queryKey: ['marketing', 'blogs', limit],
    queryFn: () =>
      fetcher<{ data?: unknown[] }>(`/api/blogs?status=active&limit=${limit}`).then(
        r => r.data ?? []
      ),
    ...defaultOptions,
  });
}

// --- Addons (deals, services, transfers) - heavily cached to avoid CRM 429s ---
const ADDON_STALE_MS = 15 * 60 * 1000; // 15 min
const ADDON_CACHE_MS = 30 * 60 * 1000; // 30 min

const addonRetry = (failureCount: number, error: unknown) => {
  const err = error as Error & { status?: number };
  if (err?.status === 429) return false;
  const msg = String(error instanceof Error ? error.message : '');
  if (msg.includes('429')) return false;
  return failureCount < 1;
};

/** Fetches all addon deals once (no nights param) to avoid 429s from rapid nights changes. Filter by nights client-side. */
export function useAddonDeals(nights?: number, enabled = true) {
  const query = useQuery({
    queryKey: ['marketing', 'addon-deals'],
    queryFn: () =>
      fetcher<{ addon_deals?: unknown[] }>('/api/website/addon-deals').then(
        r => r.addon_deals ?? []
      ),
    enabled,
    staleTime: ADDON_STALE_MS,
    gcTime: ADDON_CACHE_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: addonRetry,
    retryDelay: 3000,
  });
  const allDeals = (query.data ?? []) as Array<{ included_nights?: number[] }>;
  const filtered =
    nights != null && nights > 0
      ? allDeals.filter(
          (d) =>
            !d.included_nights?.length ||
            d.included_nights.includes(nights)
        )
      : allDeals;
  return { ...query, data: filtered };
}

export function useAddonHotelServices(enabled = true) {
  return useQuery({
    queryKey: ['marketing', 'addon-hotel-services'],
    queryFn: () =>
      fetcher<{ addon_hotel_services?: unknown[] }>(
        '/api/website/addon-hotel-services'
      ).then(r => r.addon_hotel_services ?? []),
    enabled,
    staleTime: ADDON_STALE_MS,
    gcTime: ADDON_CACHE_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: addonRetry,
    retryDelay: 3000,
  });
}

export function useAddonPrivateTransfers(enabled = true) {
  return useQuery({
    queryKey: ['marketing', 'addon-private-transfers'],
    queryFn: () =>
      fetcher<{ addon_private_transfers?: unknown[] }>(
        '/api/website/addon-private-transfers'
      ).then(r => r.addon_private_transfers ?? []),
    enabled,
    staleTime: ADDON_STALE_MS,
    gcTime: ADDON_CACHE_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: addonRetry,
    retryDelay: 3000,
  });
}

// --- CRM Package by ID (heavily cached - CRM rate limits aggressively) ---
const CRM_STALE_MS = 15 * 60 * 1000; // 15 min
const CRM_CACHE_MS = 30 * 60 * 1000; // 30 min
export function useCRMPackage(crmPackageId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ['marketing', 'crm-package', crmPackageId],
    queryFn: async () => {
      const res = await fetch(`/api/website/crm/packages/${crmPackageId}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const err = new Error(`Fetch failed: ${res.status}`);
        (err as Error & { status?: number }).status = res.status;
        throw err;
      }
      const json = (await res.json()) as { success?: boolean; data?: unknown };
      return json.success && json.data ? json.data : null;
    },
    enabled: !!crmPackageId && enabled,
    staleTime: CRM_STALE_MS,
    gcTime: CRM_CACHE_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: (failureCount, error) => {
      const err = error as Error & { status?: number };
      if (err?.status === 429) return false;
      const msg = String(error instanceof Error ? error.message : '');
      if (msg.includes('429')) return false;
      return failureCount < 1;
    },
    retryDelay: 2000,
  });
}

// --- Agent status (requires auth - fetch only when needed) ---
export function useAgentStatus(enabled = true) {
  return useQuery({
    queryKey: ['marketing', 'agent-status'],
    queryFn: () =>
      fetcher<{ hasActiveSubscription?: boolean }>(
        '/api/agent-subscription/check-agent-status'
      ),
    enabled,
    ...defaultOptions,
  });
}

// --- Addon names map (for cart/checkout display) ---
export function useAddonNames() {
  const deals = useAddonDeals();
  const services = useAddonHotelServices();
  const transfers = useAddonPrivateTransfers();

  const addonNames: Record<string, string> = {};
  (deals.data as Array<{ id?: string; name?: string; category_name?: string }> ?? []).forEach(d => {
    if (d?.id && d?.name) {
      const label = d.category_name ? `${d.name} [${d.category_name}]` : d.name;
      addonNames[d.id] = label;
    }
  });
  (services.data as Array<{ id?: string; name?: string }> ?? []).forEach(s => {
    if (s?.id && s?.name) addonNames[s.id] = s.name;
  });
  (transfers.data as Array<{ id?: string; name?: string; pax_type?: string; fixed_pax?: number; min_pax?: number; max_pax?: number }> ?? []).forEach(t => {
    if (t?.id && t?.name) {
      let extra = '';
      if (t.pax_type === 'fixed' && t.fixed_pax) extra = ` [${t.fixed_pax} pax]`;
      else if (t.pax_type === 'min_max' && t.min_pax != null && t.max_pax != null) extra = ` [${t.min_pax}-${t.max_pax} pax]`;
      addonNames[t.id] = `${t.name}${extra}`;
    }
  });

  return {
    addonNames,
    isLoading: deals.isLoading || services.isLoading || transfers.isLoading,
  };
}

// --- Prefetch helpers for eager loading ---
export function usePrefetchMarketing() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.prefetchQuery({
      queryKey: KEY_CATEGORIES,
      queryFn: () =>
        fetcher<{ data: unknown[] }>('/api/package-categories?limit=100'),
    });
  };
}
