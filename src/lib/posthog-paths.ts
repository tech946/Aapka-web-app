const PRIVATE_PREFIXES = ['/dashboard', '/auth', '/influencer'];

export function isWebsitePath(pathname: string): boolean {
  return !PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
