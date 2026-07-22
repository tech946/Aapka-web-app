/**
 * When the backend has not set a bookable price yet (base/package price and
 * alternatives are all zero), marketing surfaces show this label instead of AED.
 */
export const PACKAGE_PRICE_REVEALING_SOON = 'Revealing soon';

export type PackagePricingFields = {
  package_price?: number | null;
  adult_price?: number | null;
  child_price?: number | null;
  infant_price?: number | null;
  solo_traveller_enabled?: boolean | null;
  solo_traveller_price?: number | null;
  active_deal?: {
    deal_adult_price: number | null;
    deal_child_price: number | null;
    deal_infant_price: number | null;
    deal_solo_traveller_price: number | null;
    start_date: string;
    end_date: string;
    is_active: boolean;
  } | null;
  date_ranges?: Array<{
    adultPrice?: number;
    childPrice?: number;
    infantPrice?: number;
    soloTravellerPrice?: number | null;
    isSoldOut?: boolean;
  }> | null;
};

function activeDealHasPositivePrices(pkg: PackagePricingFields): boolean {
  const d = pkg.active_deal;
  if (!d) return false;
  const now = new Date();
  const start = new Date(d.start_date);
  const end = new Date(d.end_date);
  if (!d.is_active || now < start || now > end) return false;
  return (
    (d.deal_adult_price != null && d.deal_adult_price > 0) ||
    (d.deal_child_price != null && d.deal_child_price > 0) ||
    (d.deal_infant_price != null && d.deal_infant_price > 0) ||
    (d.deal_solo_traveller_price != null && d.deal_solo_traveller_price > 0)
  );
}

function dateRangesHavePositivePrices(pkg: PackagePricingFields): boolean {
  const ranges = pkg.date_ranges;
  if (!Array.isArray(ranges) || ranges.length === 0) return false;
  return ranges.some(r => {
    if (r.isSoldOut) return false;
    const a = Number(r.adultPrice) || 0;
    const c = Number(r.childPrice) || 0;
    const i = Number(r.infantPrice) || 0;
    const s = r.soloTravellerPrice != null ? Number(r.soloTravellerPrice) || 0 : 0;
    return a > 0 || c > 0 || i > 0 || s > 0;
  });
}

/**
 * True when there is no positive package, per-person, solo, date-range, or deal price.
 */
export function isPackagePriceRevealingSoon(
  pkg: PackagePricingFields | null | undefined
): boolean {
  if (!pkg) return true;
  if (activeDealHasPositivePrices(pkg)) return false;
  if (dateRangesHavePositivePrices(pkg)) return false;

  const pp = Number(pkg.package_price);
  const hasPackagePrice = pkg.package_price != null && !Number.isNaN(pp) && pp > 0;

  const ap = Number(pkg.adult_price) || 0;
  const cp = Number(pkg.child_price) || 0;
  const ip = Number(pkg.infant_price) || 0;
  const hasPerPerson = ap > 0 || cp > 0 || ip > 0;

  const soloOn =
    !!pkg.solo_traveller_enabled && (Number(pkg.solo_traveller_price) || 0) > 0;

  if (hasPackagePrice || hasPerPerson || soloOn) return false;
  return true;
}
