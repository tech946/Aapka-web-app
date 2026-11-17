'use client';

import { useEffect, useMemo, useState } from 'react';
import { addMonths, endOfMonth, format, startOfMonth } from 'date-fns';
import { parseDateStringToLocal } from '@/lib/utils';
import { getAnyDateBlockReason, getAnyDateEarliestBookable, type AnyDateSoldOutRange } from '@/lib/anydate-availability';
import type { SurchargeMasterEntry } from '@/lib/surcharge-master';

/* Which days the Book now modal (BookingWizard) may offer — the same rules
   the booking card's own calendars use, read from the same sources. */

const MONTHS_AHEAD = 12;

/** A fixed list of departure dates (offer packages, fixed tours, deals). */
export function useDateList(dates: string[]) {
  return useMemo(() => {
    const byKey = new Map<string, string>();
    const parsed: Date[] = [];
    for (const s of dates) {
      const d = parseDateStringToLocal(s);
      if (!d) continue;
      byKey.set(format(d, 'yyyy-MM-dd'), s);
      parsed.push(d);
    }
    parsed.sort((a, b) => a.getTime() - b.getTime());
    const now = new Date();
    return {
      has: (d: Date) => byKey.has(format(d, 'yyyy-MM-dd')),
      /** the list's own spelling of a day, for handlers that take strings */
      original: (d: Date) => byKey.get(format(d, 'yyyy-MM-dd')) ?? format(d, 'yyyy-MM-dd'),
      fromMonth: startOfMonth(parsed[0] ?? now),
      toMonth: endOfMonth(parsed[parsed.length - 1] ?? now),
    };
  }, [dates]);
}

/** Any-date packages: lead time, start / end dates, sold-out ranges and hotel
    surcharge windows (FlexibleDateCalendar's rules). */
export function useAnyDateRules(
  enabled: boolean,
  opts: { startDate?: string | null; endDate?: string | null; dateRanges?: AnyDateSoldOutRange[] | null; surchargeBlockDaysBefore?: number | null },
) {
  const [surcharges, setSurcharges] = useState<SurchargeMasterEntry[] | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    fetch('/api/surcharge-master?limit=100&page=1')
      .then((r) => r.json())
      .then((json) => !cancelled && setSurcharges(Array.isArray(json?.data) ? json.data : []))
      .catch(() => !cancelled && setSurcharges([]));
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const { startDate, endDate, dateRanges, surchargeBlockDaysBefore } = opts;
  return useMemo(() => {
    const soldOutRanges = Array.isArray(dateRanges) ? dateRanges : [];
    const end = endDate ? parseDateStringToLocal(endDate) : null;
    return {
      loading: enabled && surcharges === null,
      isDisabled: (d: Date) =>
        getAnyDateBlockReason(d, { soldOutRanges, surcharges: surcharges ?? [], surchargeBlockDaysBefore, startDate, endDate }) !== null,
      fromMonth: startOfMonth(getAnyDateEarliestBookable(startDate)),
      toMonth: end ? endOfMonth(end) : endOfMonth(addMonths(new Date(), MONTHS_AHEAD)),
    };
  }, [enabled, surcharges, dateRanges, surchargeBlockDaysBefore, startDate, endDate]);
}

/** Limited-time deals: days the deal has already sold out (daily cap). */
export function useDealSoldOut(dealId: string | null | undefined) {
  const [soldOut, setSoldOut] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!dealId) return;
    let cancelled = false;
    fetch(`/api/limited-time-deals/availability?deal_id=${dealId}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled || !json?.success || !json.data) return;
        const data = json.data as Record<string, { isSoldOut?: boolean }>;
        setSoldOut(new Set(Object.keys(data).filter((k) => data[k]?.isSoldOut)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [dealId]);
  return soldOut;
}

export const defaultRange = () => ({ fromMonth: startOfMonth(new Date()), toMonth: endOfMonth(addMonths(new Date(), MONTHS_AHEAD)) });
