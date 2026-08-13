import { supabaseAdmin } from '@/lib/supabase-admin';

type PackageDealRow = {
  package_id: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

function toDateOnly(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

/** Create a limited_time_deals row when a package_deal exists but LTD row is missing. */
export async function ensureLimitedTimeDealForPackageDeal(
  deal: PackageDealRow
): Promise<void> {
  // Deliberately limit(1) rather than maybeSingle(): maybeSingle() ERRORS when
  // more than one row matches, and the old code treated that error as "nothing
  // exists" and inserted another copy. Once two duplicates existed for a
  // package, every call added one more - unbounded growth.
  const { data: existing, error } = await supabaseAdmin
    .from('limited_time_deals')
    .select('id')
    .eq('offer_package_id', deal.package_id)
    .limit(1);

  // On a lookup failure, do nothing rather than risk inserting a duplicate.
  if (error) {
    console.error(
      '[LTD SYNC] Lookup failed for package',
      deal.package_id,
      error.message
    );
    return;
  }

  if (existing && existing.length > 0) return;

  await supabaseAdmin.from('limited_time_deals').insert({
    offer_package_id: deal.package_id,
    start_date: toDateOnly(deal.start_date),
    end_date: toDateOnly(deal.end_date),
    booking_fee_aed: 100,
    max_bookings_per_day: 48,
    is_active: deal.is_active,
  });
}

/**
 * Backfill LTD rows for all active Deals of the Day entries missing from
 * limited_time_deals.
 *
 * Do NOT call this from a GET handler - it writes, so it resurrects rows an
 * admin has just deleted. Intended for an explicit, admin-triggered backfill.
 */
export async function syncActivePackageDealsToLimitedTimeDeals(): Promise<void> {
  const { data: packageDeals, error } = await supabaseAdmin
    .from('package_deals')
    .select('package_id, start_date, end_date, is_active')
    .eq('is_active', true);

  if (error || !packageDeals?.length) return;

  for (const deal of packageDeals) {
    await ensureLimitedTimeDealForPackageDeal(deal);
  }
}

export async function setLimitedTimeDealActiveForPackage(
  packageId: string,
  isActive: boolean
): Promise<void> {
  await supabaseAdmin
    .from('limited_time_deals')
    .update({ is_active: isActive })
    .eq('offer_package_id', packageId);
}
