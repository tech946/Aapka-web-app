import { supabaseAdmin } from '@/lib/supabase-admin';
import { MARINA_CRUISE_SLUG } from '@/lib/marina-cruise-config';

export type BookingCartItemLike = {
  packageId?: string;
  packageName?: string;
  categorySlug?: string;
  selectedDate?: string | null;
  adults?: number;
  children?: number;
  infants?: number;
  price?: number;
};

export type BookingEmailPackage = {
  packageName: string;
  packageId: string;
  selectedDate: string | null;
  adults: number;
  children: number;
  infants: number;
  price: number;
};

/** Resolve display names for booking emails (packages + marina cruise dinners). */
export async function resolveBookingPackageNames(
  cartItems: BookingCartItemLike[]
): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  const unresolvedIds = new Set<string>();
  const marinaIds = new Set<string>();
  const regularIds = new Set<string>();

  for (const item of cartItems) {
    const packageId = item.packageId?.trim();
    if (!packageId) continue;

    const storedName = item.packageName?.trim();
    if (storedName) {
      names.set(packageId, storedName);
      continue;
    }

    unresolvedIds.add(packageId);
    if (item.categorySlug === MARINA_CRUISE_SLUG) {
      marinaIds.add(packageId);
    } else {
      regularIds.add(packageId);
    }
  }

  if (regularIds.size > 0) {
    const { data } = await supabaseAdmin
      .from('packages')
      .select('package_id, package_name')
      .in('package_id', [...regularIds]);

    for (const row of data || []) {
      if (row.package_name) {
        names.set(row.package_id, row.package_name);
      }
    }
  }

  if (marinaIds.size > 0) {
    const { data } = await supabaseAdmin
      .from('marina_cruise_dinners')
      .select('package_id, package_name')
      .in('package_id', [...marinaIds]);

    for (const row of data || []) {
      if (row.package_name) {
        names.set(row.package_id, row.package_name);
      }
    }
  }

  const stillMissing = [...unresolvedIds].filter(id => !names.has(id));
  if (stillMissing.length > 0) {
    const { data: packages } = await supabaseAdmin
      .from('packages')
      .select('package_id, package_name')
      .in('package_id', stillMissing);

    for (const row of packages || []) {
      if (row.package_name) {
        names.set(row.package_id, row.package_name);
      }
    }

    const missingAfterPackages = stillMissing.filter(id => !names.has(id));
    if (missingAfterPackages.length > 0) {
      const { data: marinaPackages } = await supabaseAdmin
        .from('marina_cruise_dinners')
        .select('package_id, package_name')
        .in('package_id', missingAfterPackages);

      for (const row of marinaPackages || []) {
        if (row.package_name) {
          names.set(row.package_id, row.package_name);
        }
      }
    }
  }

  return names;
}

export async function buildBookingEmailPackages(
  cartItems: BookingCartItemLike[]
): Promise<BookingEmailPackage[]> {
  const nameById = await resolveBookingPackageNames(cartItems);

  return cartItems.map(item => {
    const packageId = item.packageId || '';
    return {
      packageName:
        item.packageName?.trim() ||
        nameById.get(packageId) ||
        'Unknown Package',
      packageId,
      selectedDate: item.selectedDate ?? null,
      adults: item.adults || 0,
      children: item.children || 0,
      infants: item.infants || 0,
      price: item.price || 0,
    };
  });
}
