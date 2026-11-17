'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

/* The CRM's attraction master, fetched in slices through
   /api/website/area-category-dropdowns (which caches the CRM for an hour):
     usePopularAttractions   ?top=1 — the popular picks, loaded with the page
     useAttractionSearch     ?q=term — only once a search is submitted
   react-query keeps every answer for an hour, so repeating a search or
   coming back to the page doesn't fetch again. */

export interface Attraction {
  id: string;
  name: string;
  code?: string;
  area_id?: string;
  area_name?: string | null;
  top_attraction?: boolean;
}

const HOUR = 60 * 60 * 1000;
const KEY = ['enquiry', 'attractions'] as const;

async function fetchAttractions(params: Record<string, string>): Promise<Attraction[]> {
  const res = await fetch(`/api/website/area-category-dropdowns?${new URLSearchParams(params)}`);
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.data) throw new Error('Could not load tours');
  return Array.isArray(json.data) ? json.data : [];
}

export function usePopularAttractions() {
  return useQuery({
    queryKey: [...KEY, 'top'],
    queryFn: () => fetchAttractions({ top: '1' }),
    staleTime: HOUR,
    gcTime: HOUR,
  });
}

/** `term` is the submitted search ('' = nothing searched yet). */
export function useAttractionSearch(term: string) {
  const q = term.trim().toLowerCase();
  return useQuery({
    queryKey: [...KEY, 'search', q],
    queryFn: () => fetchAttractions({ q }),
    enabled: q.length > 0,
    staleTime: HOUR,
    gcTime: HOUR,
    // keep the last results on screen while the next search loads
    placeholderData: keepPreviousData,
  });
}
