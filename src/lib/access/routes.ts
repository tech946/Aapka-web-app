import { PERMISSIONS, hasPermission, type Permission } from './permissions';

export const DASHBOARD_HOME = '/dashboard';
export const NO_DASHBOARD_ACCESS_PATH = '/';

interface RouteRule {
  prefix: string;
  permission: Permission;
}

const ROUTE_RULES: RouteRule[] = [
  { prefix: '/dashboard/blogs/categories', permission: PERMISSIONS.BLOG_TAXONOMY },
  { prefix: '/dashboard/blogs/tags', permission: PERMISSIONS.BLOG_TAXONOMY },
  { prefix: '/dashboard/blogs/new', permission: PERMISSIONS.BLOG_WRITE },
  { prefix: '/dashboard/blogs', permission: PERMISSIONS.BLOG_READ },
  { prefix: '/dashboard/seo', permission: PERMISSIONS.CMS_READ },
  { prefix: '/dashboard/users/new', permission: PERMISSIONS.USERS_WRITE },
  { prefix: '/dashboard/users', permission: PERMISSIONS.USERS_READ },
];

const LANDING_ORDER = ['/dashboard/blogs', '/dashboard/seo', '/dashboard/users'];

function matches(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function permissionForPath(pathname: string): Permission {
  return ROUTE_RULES.find((rule) => matches(pathname, rule.prefix))?.permission ?? PERMISSIONS.ALL;
}

export function canAccessPath(granted: readonly Permission[], pathname: string): boolean {
  if (!pathname.startsWith(DASHBOARD_HOME)) return true;
  return hasPermission(granted, permissionForPath(pathname));
}

export function landingPathFor(granted: readonly Permission[]): string {
  if (hasPermission(granted, PERMISSIONS.ALL)) return DASHBOARD_HOME;
  return LANDING_ORDER.find((path) => canAccessPath(granted, path)) ?? NO_DASHBOARD_ACCESS_PATH;
}
