'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { PageSeo, PageSeoInput, SeoCatalogItem } from './schema';

const BASE = '/api/dashboard/seo';

export const seoKeys = {
  all: ['dashboard', 'seo'] as const,
  catalog: () => [...seoKeys.all, 'catalog'] as const,
  entry: (key: string) => [...seoKeys.all, 'entry', key] as const,
};

export function useSeoCatalog() {
  return useQuery({
    queryKey: seoKeys.catalog(),
    queryFn: () => api.get<{ items: SeoCatalogItem[]; tableReady: boolean }>(BASE),
    staleTime: 30_000,
    refetchOnMount: true,
  });
}

export function useSeoEntry(key: string | null) {
  return useQuery({
    queryKey: seoKeys.entry(key ?? ''),
    queryFn: () => api.get<{ entry: PageSeo | null }>(BASE, { key: key ?? '' }).then((r) => r.entry),
    enabled: Boolean(key),
    staleTime: 0,
  });
}

export function useSaveSeo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PageSeoInput) => api.put<{ entry: PageSeo }>(BASE, input).then((r) => r.entry),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: seoKeys.all }),
  });
}

export function useDeleteSeo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => api.delete<{ ok: true }>(`${BASE}?key=${encodeURIComponent(key)}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: seoKeys.all }),
  });
}
