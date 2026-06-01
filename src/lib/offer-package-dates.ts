import { format } from 'date-fns';
import { parseDateStringToLocal } from '@/lib/utils';

type TravelDateEntry = { id?: string; value: string } | string;

function normalizeTravelDateStrings(
  travelDates: TravelDateEntry[] | null | undefined
): string[] {
  if (!travelDates || !Array.isArray(travelDates) || travelDates.length === 0) {
    return [];
  }

  return [
    ...new Set(
      travelDates
        .map(d => (typeof d === 'string' ? d : d.value))
        .filter(Boolean)
        .map(dateStr => {
          const parsed = parseDateStringToLocal(dateStr);
          if (!parsed) return null;
          parsed.setHours(0, 0, 0, 0);
          return format(parsed, 'yyyy-MM-dd');
        })
        .filter((d): d is string => d != null)
    ),
  ].sort();
}

/** Offer package selectable travel dates (excludes today + next 6 days). */
export function getOfferPackageTravelDates(
  travelDates: TravelDateEntry[] | null | undefined
): string[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sixDaysFromNow = new Date(today);
  sixDaysFromNow.setDate(sixDaysFromNow.getDate() + 6);

  return normalizeTravelDateStrings(travelDates).filter(dateStr => {
    const parsed = parseDateStringToLocal(dateStr);
    if (!parsed) return false;
    parsed.setHours(0, 0, 0, 0);
    return parsed > sixDaysFromNow;
  });
}

export function getOfferPackageTravelDatesStatus(
  travelDates: TravelDateEntry[] | null | undefined
): 'none' | 'all_past' | 'available' {
  const configured = normalizeTravelDateStrings(travelDates);
  if (configured.length === 0) return 'none';
  if (getOfferPackageTravelDates(travelDates).length === 0) return 'all_past';
  return 'available';
}
