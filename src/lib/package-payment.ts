/**
 * Per-package checkout payment rule (`packages.accept_payment`).
 *
 * 'half' - customer may choose Half Payment (50%) or Full Payment  (default)
 * 'full' - only Full Payment is offered
 *
 * This is one of several inputs to the checkout rule. Full payment is forced
 * when ANY of these is true:
 *   - the cart contains a tour or the marina cruise (category rule)
 *   - the buyer is a subscribed agent
 *   - any package in the cart has accept_payment = 'full'
 */

export type AcceptPayment = 'full' | 'half';

/** Packages default to allowing the half-payment option. */
export const DEFAULT_ACCEPT_PAYMENT: AcceptPayment = 'half';

/**
 * Coerces any stored/submitted value to a valid AcceptPayment.
 * Unknown or missing values fall back to 'half' so existing rows and older
 * clients keep today's behaviour.
 */
export function normalizeAcceptPayment(value: unknown): AcceptPayment {
  return String(value).trim().toLowerCase() === 'full'
    ? 'full'
    : DEFAULT_ACCEPT_PAYMENT;
}

/** True when this package may only be paid in full. */
export function packageRequiresFullPayment(pkg: {
  accept_payment?: string | null;
}): boolean {
  return normalizeAcceptPayment(pkg?.accept_payment) === 'full';
}
