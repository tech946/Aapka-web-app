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
  const { data: existing } = await supabaseAdmin
    .from('limited_time_deals')
    .select('id')
    .eq('offer_package_id', deal.package_id)
    .maybeSingle();

  if (existing) return;

  await supabaseAdmin.from('limited_time_deals').insert({
    offer_package_id: deal.package_id,
    start_date: toDateOnly(deal.start_date),
    end_date: toDateOnly(deal.end_date),
    booking_fee_aed: 100,
    max_bookings_per_day: 48,
    is_active: deal.is_active,
  });
}

/** Backfill LTD rows for all active Deals of the Day entries missing from limited_time_deals. */
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
