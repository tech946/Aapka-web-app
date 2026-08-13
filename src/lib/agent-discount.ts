/**
 * Agent (partner) discount helpers.
 *
 * `packages.agent_discount` is a PERCENTAGE off the total, applied only for a
 * logged-in agent whose subscription is paid, active and unexpired. The
 * authoritative calculation lives server-side in /api/cart/validate - these
 * helpers exist so every marketing surface (home sliders, listings, detail
 * pages) previews the exact same number instead of re-deriving it ad hoc.
 */

export type AgentDiscountablePackage = {
  agent_discount?: number | null;
} | null | undefined;

/**
 * Effective discount percentage for this viewer, or 0 when none applies.
 * Clamped to 0-100 so bad admin data can never produce a negative price.
 */
export function getAgentDiscountPercentage(
  pkg: AgentDiscountablePackage,
  hasActiveAgentSubscription: boolean
): number {
  if (!hasActiveAgentSubscription || !pkg) return 0;

  const percentage = Number(pkg.agent_discount);
  if (!Number.isFinite(percentage) || percentage <= 0) return 0;

  return Math.min(percentage, 100);
}

/**
 * Applies a percentage to a price. Returns the price untouched when there is
 * no discount, and preserves null/undefined so "N/A" rendering still works.
 */
export function applyAgentDiscount<T extends number | null | undefined>(
  price: T,
  percentage: number
): T extends number ? number : number | null {
  const numeric = Number(price);
  if (price == null || !Number.isFinite(numeric)) {
    return null as never;
  }
  if (percentage <= 0) {
    return numeric as never;
  }
  return Math.max(0, numeric * (1 - percentage / 100)) as never;
}
