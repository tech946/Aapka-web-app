import {
  BadgePercent,
  BookOpen,
  Bus,
  CalendarCheck,
  CalendarRange,
  CreditCard,
  DollarSign,
  FileDown,
  LayoutDashboard,
  Mail,
  Megaphone,
  Package,
  FileCode2,
  Ship,
  Tag,
  UserCog,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { PERMISSIONS, hasPermission, type Permission } from '@/lib/access';

export interface NavChild {
  href: string;
  label: string;
  permission?: Permission;
}

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href?: string;
  modal?: 'price-master' | 'platform-fee';
  children?: NavChild[];
  navigateParent?: boolean;
  permission?: Permission;
}

export interface NavSection {
  label: string | null;
  items: NavItem[];
}

export const PACKAGES_HREF = '/dashboard/package-categories';

export function categorySlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function buildNav(categories: Array<{ id: string; name: string }>): NavSection[] {
  return [
    {
      label: null,
      items: [{ label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' }],
    },
    {
      label: 'Packages',
      items: [
        {
          label: 'Packages',
          icon: Package,
          href: PACKAGES_HREF,
          navigateParent: true,
          children: categories.map((c) => ({
            href: `${PACKAGES_HREF}/${encodeURIComponent(categorySlug(c.name))}`,
            label: c.name,
          })),
        },
        { label: 'Marina Cruise Dinner', icon: Ship, href: '/dashboard/marina-cruise-dinner' },
        { label: 'Limited Time Deals', icon: Zap, href: '/dashboard/limited-time-deals' },
        { label: 'Deals of the Day', icon: Tag, href: '/dashboard/deals-of-the-day' },
      ],
    },
    {
      label: 'Bookings',
      items: [
        { label: 'Payments', icon: CreditCard, href: '/dashboard/payments' },
        { label: 'Booking Payments', icon: CalendarCheck, href: '/dashboard/booking-payments' },
      ],
    },
    {
      label: 'Enquiries',
      items: [
        { label: 'Contact Queries', icon: Mail, href: '/dashboard/contact-queries' },
        { label: 'PDF Enquiries', icon: FileDown, href: '/dashboard/pdf-enquiries' },
        { label: 'Oman Transport', icon: Bus, href: '/dashboard/oman-transport-enquiries' },
      ],
    },
    {
      label: 'Partners',
      items: [
        { label: 'Agents', icon: Users, href: '/dashboard/agents' },
        {
          label: 'Influencers',
          icon: Megaphone,
          href: '/dashboard/influencers',
          children: [
            { href: '/dashboard/influencers', label: 'Manage Influencers' },
            { href: '/dashboard/influencers/invite', label: 'Send Invitations' },
            { href: '/dashboard/influencers/commissions', label: 'Commission Settings' },
            { href: '/dashboard/influencers/conversions', label: 'Referral Conversions' },
            { href: '/dashboard/influencers/withdrawals', label: 'Withdrawal Requests' },
          ],
        },
      ],
    },
    {
      label: 'Content',
      items: [
        {
          label: 'Blogs',
          icon: BookOpen,
          href: '/dashboard/blogs',
          permission: PERMISSIONS.BLOG_READ,
          children: [
            { href: '/dashboard/blogs', label: 'All posts', permission: PERMISSIONS.BLOG_READ },
            { href: '/dashboard/blogs/new', label: 'Write a post', permission: PERMISSIONS.BLOG_WRITE },
            { href: '/dashboard/blogs/categories', label: 'Categories', permission: PERMISSIONS.BLOG_TAXONOMY },
            { href: '/dashboard/blogs/tags', label: 'Tags', permission: PERMISSIONS.BLOG_TAXONOMY },
          ],
        },
        { label: 'SEO & Schema', icon: FileCode2, href: '/dashboard/seo', permission: PERMISSIONS.CMS_READ },
      ],
    },
    {
      label: 'Team',
      items: [{ label: 'Users', icon: UserCog, href: '/dashboard/users', permission: PERMISSIONS.USERS_READ }],
    },
    {
      label: 'Masters',
      items: [
        { label: 'Price Master', icon: DollarSign, modal: 'price-master' },
        { label: 'Platform Fee', icon: BadgePercent, modal: 'platform-fee' },
        { label: 'Surcharge Master', icon: CalendarRange, href: '/dashboard/surcharge-master' },
      ],
    },
  ];
}

function allowed(granted: readonly Permission[], permission: Permission = PERMISSIONS.ALL): boolean {
  return hasPermission(granted, permission);
}

export function visibleNav(sections: NavSection[], granted: readonly Permission[]): NavSection[] {
  return sections
    .map((section) => ({
      ...section,
      items: section.items
        .filter((item) => allowed(granted, item.permission))
        .map((item) =>
          item.children ? { ...item, children: item.children.filter((c) => allowed(granted, c.permission)) } : item,
        ),
    }))
    .filter((section) => section.items.length > 0);
}

export interface Crumb {
  label: string;
  href?: string;
}

function humanize(segment: string): string {
  let value = segment;
  try {
    value = decodeURIComponent(segment);
  } catch {
    value = segment;
  }
  return value
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

const looksLikeId = (segment: string) => /^\d+$/.test(segment) || /^[0-9a-f-]{16,}$/i.test(segment);

export function breadcrumbsFor(pathname: string, sections: NavSection[]): Crumb[] {
  const crumbs: Crumb[] = [{ label: 'Dashboard', href: '/dashboard' }];
  if (pathname === '/dashboard' || pathname === '/dashboard/') return [{ label: 'Dashboard' }];

  let best: { trail: Crumb[]; href: string } | null = null;
  for (const section of sections) {
    for (const item of section.items) {
      const candidates: Array<{ trail: Crumb[]; href: string }> = [];
      if (item.href && item.href !== '/dashboard') candidates.push({ trail: [{ label: item.label, href: item.href }], href: item.href });
      for (const child of item.children ?? []) {
        const trail: Crumb[] = [{ label: item.label, href: item.href }];
        if (child.label !== item.label && child.href !== item.href) trail.push({ label: child.label, href: child.href });
        candidates.push({ trail, href: child.href });
      }
      for (const c of candidates) {
        const hit = pathname === c.href || pathname.startsWith(`${c.href}/`);
        if (hit && (!best || c.href.length > best.href.length)) best = c;
      }
    }
  }

  let rest = pathname.split('/').filter(Boolean).slice(1);
  if (best) {
    crumbs.push(...best.trail);
    rest = pathname.slice(best.href.length).split('/').filter(Boolean);
  }
  let href = best?.href ?? '/dashboard';
  for (const segment of rest) {
    href += `/${segment}`;
    if (looksLikeId(segment)) continue;
    crumbs.push({ label: humanize(segment), href });
  }

  const last = crumbs[crumbs.length - 1];
  crumbs[crumbs.length - 1] = { label: last.label };
  return crumbs;
}
