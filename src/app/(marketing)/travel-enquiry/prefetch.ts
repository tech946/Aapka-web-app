import 'server-only';
import { NextRequest } from 'next/server';
import { QueryClient, dehydrate, type DehydratedState } from '@tanstack/react-query';
import { GET as getAttractions } from '@/app/api/website/area-category-dropdowns/route';

const TIMEOUT_MS = 1500;

async function popular(): Promise<unknown[] | null> {
  try {
    const res = await getAttractions(new NextRequest(new URL('/api/website/area-category-dropdowns?top=1', 'http://localhost')));
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: unknown };
    return Array.isArray(json.data) ? json.data : null;
  } catch {
    return null;
  }
}

export async function prefetchEnquiry(): Promise<DehydratedState> {
  const client = new QueryClient();
  if (process.env.NEXT_PHASE === 'phase-production-build') return dehydrate(client);
  const data = await Promise.race([popular(), new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS))]);
  if (data) client.setQueryData(['enquiry', 'attractions', 'top'], data);
  return dehydrate(client);
}
