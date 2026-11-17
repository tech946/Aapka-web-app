export type SeoGroup = 'Main pages' | 'Forms & services' | 'Policies' | 'Packages' | 'Marina cruises' | 'Limited time deals';

export interface SeoPageRef {
  key: string;
  path: string;
  label: string;
  group: SeoGroup;
}

export const STATIC_SEO_PAGES: SeoPageRef[] = [
  { key: '/', path: '/', label: 'Home', group: 'Main pages' },
  { key: '/holidays', path: '/holidays', label: 'All holidays (listing)', group: 'Main pages' },
  { key: '/About', path: '/About', label: 'About us', group: 'Main pages' },
  { key: '/contact', path: '/contact', label: 'Contact us', group: 'Main pages' },
  { key: '/faq', path: '/faq', label: 'FAQs', group: 'Main pages' },
  { key: '/journeys', path: '/journeys', label: 'Journeys', group: 'Main pages' },
  { key: '/founder-message', path: '/founder-message', label: 'Founder message', group: 'Main pages' },
  { key: '/travel-enquiry', path: '/travel-enquiry', label: 'Travel enquiry', group: 'Forms & services' },
  { key: '/plan-my-trip', path: '/plan-my-trip', label: 'Plan my trip', group: 'Forms & services' },
  { key: '/customize-your-package', path: '/customize-your-package', label: 'Customise your package', group: 'Forms & services' },
  { key: '/visas/apply-for-oman-visa', path: '/visas/apply-for-oman-visa', label: 'Oman visa', group: 'Forms & services' },
  { key: '/oman-transport', path: '/oman-transport', label: 'Oman transport', group: 'Forms & services' },
  { key: '/become-partner', path: '/become-partner', label: 'Become a partner', group: 'Forms & services' },
  { key: '/b2b-collaboration', path: '/b2b-collaboration', label: 'B2B collaboration', group: 'Forms & services' },
  { key: '/terms-and-conditions', path: '/terms-and-conditions', label: 'Terms and conditions', group: 'Policies' },
  { key: '/privacy-policy', path: '/privacy-policy', label: 'Privacy policy', group: 'Policies' },
  { key: '/cancellation-policy', path: '/cancellation-policy', label: 'Cancellation policy', group: 'Policies' },
  { key: '/disclaimer', path: '/disclaimer', label: 'Disclaimer', group: 'Policies' },
];

const SUFFIX = /-([0-9a-f]{5})$/i;

function suffixKey(prefix: string, slug: string): string | null {
  const match = decodeURIComponent(slug).match(SUFFIX);
  return match ? `${prefix}:${match[1].toLowerCase()}` : null;
}

export function idSuffix(id: string): string {
  return id.replace(/-/g, '').slice(-5).toLowerCase();
}

export function normalizePath(path: string): string {
  const clean = (path.split(/[?#]/)[0] || '/').replace(/\/+$/, '');
  return clean === '' ? '/' : clean;
}

export function seoKeyForPath(rawPath: string): string | null {
  const path = normalizePath(rawPath);
  if (path.startsWith('/dashboard') || path.startsWith('/auth') || path.startsWith('/blogs') || path.startsWith('/api')) return null;

  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'category' && parts.length === 3) return suffixKey('package', parts[2]);
  if (parts[0] === 'marina-cruise-dinner' && parts.length === 2) return suffixKey('marina', parts[1]);
  if (parts[0] === 'limited-time-deals' && parts.length === 2) return suffixKey('deal', parts[1]);
  return path;
}
