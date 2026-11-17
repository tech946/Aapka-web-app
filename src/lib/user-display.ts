interface NamedUser {
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}

export function userDisplayName(user: NamedUser | null | undefined): string {
  const meta = user?.user_metadata ?? {};
  const name = String(meta.full_name || meta.name || '').trim();
  return name || (user?.email ?? '').split('@')[0] || 'Account';
}

export function userInitials(label: string): string {
  const parts = label.replace(/@.*/, '').split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
