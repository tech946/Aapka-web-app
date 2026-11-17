export const PERMISSIONS = {
  ALL: '*',
  BLOG_READ: 'blog.read',
  BLOG_WRITE: 'blog.write',
  BLOG_PUBLISH: 'blog.publish',
  BLOG_DELETE: 'blog.delete',
  BLOG_TAXONOMY: 'blog.taxonomy',
  CMS_READ: 'cms.read',
  CMS_WRITE: 'cms.write',
  USERS_READ: 'users.read',
  USERS_WRITE: 'users.write',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const UPLOAD_PERMISSIONS: Permission[] = [PERMISSIONS.BLOG_WRITE, PERMISSIONS.CMS_WRITE];

export function hasPermission(granted: readonly Permission[], needed: Permission): boolean {
  return granted.includes(PERMISSIONS.ALL) || granted.includes(needed);
}

export function hasAnyPermission(granted: readonly Permission[], needed: readonly Permission[]): boolean {
  return needed.some((p) => hasPermission(granted, p));
}
