import { parseDateStringToLocal } from '@/lib/utils';

export type SurchargeMasterEntry = {
  id: string;
  price: number;
  from_date: string;
  to_date: string;
};

function toDateOnly(value: string): string {
  return value.split('T')[0];
}

/** Total surcharge for a travel date (sum of all matching date ranges). */
export function getSurchargeAmountForDate(
  dateStr: string | null | undefined,
  entries: SurchargeMasterEntry[]
): number {
  if (!dateStr || !entries.length) return 0;

  const check = parseDateStringToLocal(toDateOnly(dateStr));
  if (!check) return 0;
  check.setHours(0, 0, 0, 0);

  let total = 0;
  for (const entry of entries) {
    const from = parseDateStringToLocal(toDateOnly(entry.from_date));
    const to = parseDateStringToLocal(toDateOnly(entry.to_date));
    if (!from || !to) continue;
    from.setHours(0, 0, 0, 0);
    to.setHours(0, 0, 0, 0);
    if (check >= from && check <= to) {
      total += Number(entry.price) || 0;
    }
  }

  return Math.round(total * 100) / 100;
}
