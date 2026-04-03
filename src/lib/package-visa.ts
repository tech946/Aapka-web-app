/**
 * Visa fields from package API — optional add-on vs included at 0 AED is determined
 * by with_visa plus per-pax visa prices.
 */
export type PackageVisaFields = {
  with_visa?: boolean | null;
  adult_visa_price?: number | null;
  child_visa_price?: number | null;
  infant_visa_price?: number | null;
};

export function hasVisaAddOnPriceGreaterThanZero(
  pkg: PackageVisaFields | null | undefined
): boolean {
  if (!pkg) return false;
  const a = Number(pkg.adult_visa_price) || 0;
  const c = Number(pkg.child_visa_price) || 0;
  const i = Number(pkg.infant_visa_price) || 0;
  return a > 0 || c > 0 || i > 0;
}

/** Visa is included in the package at no extra charge (UI hides the checkbox; cart still applies visa). */
export function hasVisaIncludedAtZeroPrice(
  pkg: PackageVisaFields | null | undefined
): boolean {
  if (!pkg || !pkg.with_visa) return false;
  return !hasVisaAddOnPriceGreaterThanZero(pkg);
}

/**
 * Show "With Visa" only for categories that support it, when backend enables
 * optional visa (with_visa) and at least one visa price is greater than 0 AED.
 */
export function shouldShowOptionalVisaInBookingModal(
  slug: string,
  pkg: PackageVisaFields | null | undefined
): boolean {
  if (slug !== 'flexible-date-packages' && slug !== 'offer-packages') {
    return false;
  }
  if (!pkg || !pkg.with_visa) return false;
  return hasVisaAddOnPriceGreaterThanZero(pkg);
}
