import { PERMISSIONS, type Permission } from './permissions';

export const ROLE_IDS = {
  SUPER_ADMIN: 1,
  CONTENT_EDITOR: 2,
  DM_ADMIN: 81,
  DM_EXECUTIVE: 82,
} as const;

export type RoleId = (typeof ROLE_IDS)[keyof typeof ROLE_IDS];

export interface RoleDefinition {
  id: RoleId;
  key: string;
  label: string;
  description: string;
  permissions: Permission[];
  assignable: boolean;
}

const P = PERMISSIONS;

export const ROLE_DEFINITIONS: Record<RoleId, RoleDefinition> = {
  [ROLE_IDS.SUPER_ADMIN]: {
    id: ROLE_IDS.SUPER_ADMIN,
    key: 'super_admin',
    label: 'Super Admin',
    description: 'Full access to every part of the dashboard.',
    permissions: [P.ALL],
    assignable: false,
  },
  [ROLE_IDS.CONTENT_EDITOR]: {
    id: ROLE_IDS.CONTENT_EDITOR,
    key: 'content_editor',
    label: 'Content Editor',
    description: 'Edits page SEO: meta titles, descriptions and schema.',
    permissions: [P.CMS_READ, P.CMS_WRITE],
    assignable: true,
  },
  [ROLE_IDS.DM_ADMIN]: {
    id: ROLE_IDS.DM_ADMIN,
    key: 'dm_admin',
    label: 'DM Admin',
    description: 'Digital marketing lead. Writes, publishes and deletes blogs, manages categories and tags, edits page SEO and schema.',
    permissions: [
      P.BLOG_READ,
      P.BLOG_WRITE,
      P.BLOG_PUBLISH,
      P.BLOG_DELETE,
      P.BLOG_TAXONOMY,
      P.CMS_READ,
      P.CMS_WRITE,
    ],
    assignable: true,
  },
  [ROLE_IDS.DM_EXECUTIVE]: {
    id: ROLE_IDS.DM_EXECUTIVE,
    key: 'dm_executive',
    label: 'DM Executive',
    description: 'Digital marketing executive. Writes blog drafts and edits page SEO and schema; a DM Admin publishes.',
    permissions: [P.BLOG_READ, P.BLOG_WRITE, P.CMS_READ, P.CMS_WRITE],
    assignable: true,
  },
};

export const ALL_ROLES: RoleDefinition[] = Object.values(ROLE_DEFINITIONS);

export const KNOWN_ROLE_IDS: RoleId[] = ALL_ROLES.map((r) => r.id);

export const ASSIGNABLE_ROLES: RoleDefinition[] = ALL_ROLES.filter((r) => r.assignable);

export function isKnownRoleId(value: unknown): value is RoleId {
  return KNOWN_ROLE_IDS.includes(Number(value) as RoleId);
}

export function getRole(roleId: number | null | undefined): RoleDefinition | null {
  return isKnownRoleId(roleId) ? ROLE_DEFINITIONS[Number(roleId) as RoleId] : null;
}

export function resolvePermissions(roleIds: readonly number[]): Permission[] {
  const granted = new Set<Permission>();
  for (const id of roleIds) {
    for (const permission of getRole(id)?.permissions ?? []) granted.add(permission);
  }
  return [...granted];
}
