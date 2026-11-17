import 'server-only';
import { NextRequest } from 'next/server';
import { QueryClient, dehydrate, type DehydratedState } from '@tanstack/react-query';
import { GET as getCategories } from '@/app/api/package-categories/route';
import { GET as getPackages } from '@/app/api/packages/route';
import { GET as getMarina } from '@/app/api/marina-cruise-dinners/route';
import { GET as getDeals } from '@/app/api/limited-time-deals/route';
import { GET as getAgentStatus } from '@/app/api/agent-subscription/check-agent-status/route';

const ALL = 100;

type Handler = (req: NextRequest) => Promise<Response>;

async function call<T>(handler: Handler, path: string): Promise<T | null> {
  try {
    const res = await handler(new NextRequest(new URL(path, 'http://localhost')));
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function prefetchHolidays(): Promise<DehydratedState> {
  const client = new QueryClient();

  const [categories, marina, deals, agent] = await Promise.all([
    call<{ data?: Array<{ id?: string; category_id?: string }> }>(getCategories, `/api/package-categories?limit=${ALL}`),
    call<{ data?: unknown[] }>(getMarina, `/api/marina-cruise-dinners?limit=${ALL}&status=active&listing_page_only=true`),
    call<{ data?: Array<{ package?: unknown }> }>(getDeals, '/api/limited-time-deals'),
    call<{ hasActiveSubscription?: boolean }>(getAgentStatus, '/api/agent-subscription/check-agent-status'),
  ]);

  if (agent) client.setQueryData(['marketing', 'agent-status'], agent);
  if (marina) client.setQueryData(['marketing', 'marina-cruise-dinners', ALL, true], marina);
  if (deals) client.setQueryData(['marketing', 'limited-time-deals', 'listing'], (deals.data ?? []).filter((d) => d.package));

  if (categories?.data) {
    client.setQueryData(['marketing', 'package-categories', ALL], categories.data);
    const ids = categories.data.map((c) => String(c.id ?? c.category_id)).filter((id) => id && id !== 'undefined');
    const lists = await Promise.all(
      ids.map((id) =>
        call<{ data?: unknown[] }>(
          getPackages,
          `/api/packages?category_id=${id}&limit=${ALL}&page=1&status=active&sort_by=created_at_desc&listing_page_only=true`,
        ),
      ),
    );
    ids.forEach((id, i) => {
      const list = lists[i];
      if (list) client.setQueryData(['marketing', 'packages', id, ALL, 'active', 1, 'created_at_desc', true], list);
    });
  }

  return dehydrate(client);
}
