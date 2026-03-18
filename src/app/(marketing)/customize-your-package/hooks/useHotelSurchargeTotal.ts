'use client';

import { useState, useEffect } from 'react';

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

interface HotelItem {
  id?: string;
  hotel_id?: string;
  nights?: number;
  item_type?: string;
  hotel_data?: { roomType?: string };
  rooms?: number;
}

interface HotelOverrides {
  rooms?: number;
  extraBedCount?: number;
  childNoBedCount?: number;
}

/**
 * Fetches total hotel surcharge for CRM package hotels based on check-in and effective nights.
 * Re-runs when crmPackageData, checkInDate, effectiveNights, or hotelOverrides change.
 */
export function useHotelSurchargeTotal(
  crmPackageData: unknown,
  checkInDate: string,
  effectiveNights: number,
  hotelOverrides?: Record<string, HotelOverrides>
): number {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!crmPackageData || !checkInDate || typeof checkInDate !== 'string' || checkInDate.length < 10) {
      setTotal(0);
      return;
    }

    const pkg = crmPackageData as {
      package_options?: Array<{ package_items?: HotelItem[] }>;
      package_nights?: number;
    };
    const items = pkg?.package_options?.[0]?.package_items ?? [];
    const hotels = items.filter((i) => (i as HotelItem & { item_type?: string }).item_type === 'hotel' || (i as HotelItem).hotel_id);
    if (hotels.length === 0) {
      setTotal(0);
      return;
    }

    const baseNightsFromHotels = hotels.slice(0, -1).reduce((s, x) => s + ((x as HotelItem).nights ?? 1), 0);
    const derivedNights = effectiveNights >= 1 ? effectiveNights : Math.max(1, pkg?.package_nights ?? 0);
    if (derivedNights < 1) {
      setTotal(0);
      return;
    }

    let cancelled = false;
    const fetchAll = async () => {
      let runningCheckIn = checkInDate;
      let sum = 0;

      for (let i = 0; i < hotels.length; i++) {
        if (cancelled) return;
        const h = hotels[i] as HotelItem;
        const hotelId = h.hotel_id;
        if (!hotelId) continue;

        const override = (hotelOverrides && h.id ? hotelOverrides[h.id] : undefined) ?? {};
        const rooms = override.rooms ?? h.rooms ?? 1;

        const isLast = i === hotels.length - 1;
        const nightsForHotel = isLast
          ? Math.max(1, derivedNights - baseNightsFromHotels)
          : (h.nights ?? 1);
        const checkOut = addDays(runningCheckIn, nightsForHotel);

        try {
          const params = new URLSearchParams({
            hotel_id: hotelId,
            room_type: (h.hotel_data?.roomType as string) || '',
            check_in: runningCheckIn,
            check_out: checkOut,
            rooms: String(rooms),
          });
          const res = await fetch(`/api/website/crm/hotel-surcharge/calculate?${params}`, {
            credentials: 'include',
          });
          const data = await res.json();
          const amt =
            typeof data?.surcharge_amount === 'number'
              ? data.surcharge_amount
              : typeof data?.data?.surcharge_amount === 'number'
                ? data.data.surcharge_amount
                : null;
          if (res.ok && amt != null) {
            sum += amt;
          }
        } catch {
          // ignore
        }

        runningCheckIn = checkOut;
      }

      if (!cancelled) setTotal(sum);
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [crmPackageData, checkInDate, effectiveNights, hotelOverrides]);

  return total;
}
