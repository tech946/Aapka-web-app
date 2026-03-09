/**
 * Shared types for Customize Your Package flow
 */

export interface PackageOption {
  package_id: string;
  package_name: string;
  package_price: number | null;
  package_nights?: number | null;
  package_days?: number | null;
  adult_price?: number | null;
  child_price?: number | null;
  infant_price?: number | null;
  solo_traveller_enabled?: boolean | null;
  solo_traveller_price?: number | null;
  min_adults?: number | null;
  category_name?: string | null;
  category_slug?: string | null;
  /** CRM package id - when set, itinerary is fetched from CRM */
  crm_package_id?: string | null;
}

export interface AddonDeal {
  id: string;
  name: string;
  adult_price: number;
  child_price: number;
  infant_price: number;
  category_name?: string | null;
}

export interface AddonHotelService {
  id: string;
  name: string;
  adult_price: number;
  child_price: number;
  infant_price: number;
}

export interface AddonPrivateTransfer {
  id: string;
  name: string;
  pax_type: string;
  fixed_pax: number | null;
  min_pax: number | null;
  max_pax: number | null;
  adult_price: number;
  child_price: number;
  infant_price: number;
}

export interface PersonCounts {
  adults: number;
  children: number;
  infants: number;
}
