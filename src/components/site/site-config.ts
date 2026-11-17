import { LIMITED_DEALS, holidaysHref } from '@/config/holiday-types';

/* Site-wide copy and links for the redesigned chrome (header, footer,
   newsletter). One place to edit contact details and the announcement bar. */

/** Phone/desktop split used by the site chrome (keep in step with the
    `max-width: 767px` blocks in the stylesheets). For <picture> sources. */
export const MEDIA = {
  phone: '(max-width: 767px)',
  desktop: '(min-width: 768px)',
};

/** 1×1 transparent gif: a <picture> source that skips an image the
    current screen size hides anyway, so it isn't downloaded. */
export const BLANK_IMG = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export const CONTACT = {
  uaePhone: '+971 56 780 9460',
  uaePhoneHref: 'tel:+971567809460',
  indiaPhone: '+91 70428 57575',
  indiaPhoneHref: 'tel:+917042857575',
  email: 'info@aapkatourism.com',
  whatsappNumber: '971567809460',
  whatsappHref: 'https://wa.me/971567809460',
  dubaiOffice: 'Office #10118, CBD Bank Building, Near Sharaf DG Metro Exit 1, Al Mankhool, Bur Dubai, UAE.',
  indiaOffice: 'India Office: 1522 B, Hemkunt Chambers 89, Nehru Place, Delhi 110019',
};

/** Ink bar above the header. No coupon code: none exists in production. */
export const ANNOUNCEMENT = {
  badge: 'Limited Time',
  text: 'Limited Time Deals — hand-picked Dubai & UAE holidays at special prices',
  href: holidaysHref(LIMITED_DEALS.key),
  cta: 'View deals',
};

export type SocialId = 'instagram' | 'facebook' | 'youtube' | 'whatsapp';

export const SOCIALS: { id: SocialId; label: string; href: string }[] = [
  { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/kamalpandeyvlogs/' },
  { id: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/KamalPandeyVlog' },
  { id: 'youtube', label: 'YouTube', href: 'https://www.youtube.com/@KamalPandeyVlog' },
  { id: 'whatsapp', label: 'WhatsApp', href: CONTACT.whatsappHref },
];

export const INSTAGRAM_HREF = SOCIALS[0].href;

/** Same slug rule the category pages and the old header used. */
export function categorySlug(name: string): string {
  return String(name ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Listing link for a CRM category: the /holidays page filtered to it. */
export function categoryHref(name: string): string {
  return holidaysHref(categorySlug(name));
}
