/**
 * Utility functions for package deals
 */

export interface PackageDeal {
  id: string;
  package_id: string;
  deal_adult_price: number | null;
  deal_child_price: number | null;
  deal_infant_price: number | null;
  deal_solo_traveller_price: number | null;
  original_adult_price: number | null;
  original_child_price: number | null;
  original_infant_price: number | null;
  original_solo_traveller_price: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch active deals for given package IDs
 */
export async function getActiveDealsForPackages(
  packageIds: string[]
): Promise<Map<string, PackageDeal>> {
  if (!packageIds || packageIds.length === 0) {
    return new Map();
  }

  try {
    const now = new Date().toISOString();
    const response = await fetch(
      `/api/package-deals?active_only=true&${packageIds
        .map((id) => `package_id=${id}`)
        .join('&')}`
    );

    if (!response.ok) {
      console.error('Failed to fetch active deals');
      return new Map();
    }

    const { data } = await response.json();
    const dealsMap = new Map<string, PackageDeal>();

    if (Array.isArray(data)) {
      data.forEach((deal: PackageDeal) => {
        // Only include deals that are currently active (within date range)
        const startDate = new Date(deal.start_date);
        const endDate = new Date(deal.end_date);
        const nowDate = new Date(now);

        if (
          deal.is_active &&
          nowDate >= startDate &&
          nowDate <= endDate
        ) {
          dealsMap.set(deal.package_id, deal);
        }
      });
    }

    return dealsMap;
  } catch (error) {
    console.error('Error fetching active deals:', error);
    return new Map();
  }
}

/**
 * Apply deal prices to package prices if deal is active
 */
export function applyDealPrices(
  packageId: string,
  adultPrice: number,
  childPrice: number,
  infantPrice: number,
  soloTravellerPrice: number | null,
  deal: PackageDeal | null
): {
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  soloTravellerPrice: number | null;
} {
  if (!deal || deal.package_id !== packageId) {
    return {
      adultPrice,
      childPrice,
      infantPrice,
      soloTravellerPrice,
    };
  }

  // Check if deal is currently active
  const now = new Date();
  const startDate = new Date(deal.start_date);
  const endDate = new Date(deal.end_date);

  if (!deal.is_active || now < startDate || now > endDate) {
    return {
      adultPrice,
      childPrice,
      infantPrice,
      soloTravellerPrice,
    };
  }

  // Apply deal prices (use deal price if set, otherwise keep original)
  return {
    adultPrice:
      deal.deal_adult_price !== null
        ? deal.deal_adult_price
        : adultPrice,
    childPrice:
      deal.deal_child_price !== null
        ? deal.deal_child_price
        : childPrice,
    infantPrice:
      deal.deal_infant_price !== null
        ? deal.deal_infant_price
        : infantPrice,
    soloTravellerPrice:
      deal.deal_solo_traveller_price !== null
        ? deal.deal_solo_traveller_price
        : soloTravellerPrice,
  };
}
