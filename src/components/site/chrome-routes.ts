/* Which routes get the public site chrome. One place for the rules, read
   by the header and the footer (same header + footer on every screen size;
   phones use the header's ≡ menu). */

/** Routes that bring their own app shell: no site chrome at all. */
const APP_SHELL_PREFIXES = ['/dashboard', '/auth'];

/** Focused flows that keep the header but drop the footer. */
const NO_FOOTER_PREFIXES = ['/checkout'];

const startsWithAny = (pathname: string, prefixes: string[]) => prefixes.some((p) => pathname.startsWith(p));

const OWN_CHROME_PATHS = new Set(['/', '/About', '/faq', '/journeys', '/holidays', '/checkout', '/contact', '/travel-enquiry', '/travel-enquiry/thank-you', '/plan-my-trip', '/become-partner', '/become-partner/subscribe', '/founder-message', '/terms-and-conditions', '/privacy-policy', '/cancellation-policy', '/disclaimer', '/join-program']);

const OWN_CHROME_PREFIXES = ['/blogs'];

const isSection = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

export function showSiteHeader(pathname: string): boolean {
  return (
    !startsWithAny(pathname, APP_SHELL_PREFIXES) &&
    !OWN_CHROME_PATHS.has(pathname) &&
    !OWN_CHROME_PREFIXES.some((p) => isSection(pathname, p)) &&
    !isPackageDetail(pathname)
  );
}

export function showSiteFooter(pathname: string): boolean {
  return showSiteHeader(pathname) && !startsWithAny(pathname, NO_FOOTER_PREFIXES);
}

/** Package detail pages (packages, Marina cruises, limited-time deals). They
    have their own section bar, so no sticky header or type row. */
export function isPackageDetail(pathname: string): boolean {
  return /^\/(?:category\/[^/]+|marina-cruise-dinner|limited-time-deals)\/[^/]+\/?$/.test(pathname);
}

