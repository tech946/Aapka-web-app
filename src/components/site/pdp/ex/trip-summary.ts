'use client';

import { createContext, useContext } from 'react';

export interface TripSummary {
  name: string;
  image?: string;
  sub: string;
  badge?: string | null;
  from?: { now: number | null; strike?: number | null; basis: string } | null;
}

export const TripSummaryContext = createContext<TripSummary | null>(null);

export function useTripSummary(): TripSummary | null {
  return useContext(TripSummaryContext);
}
