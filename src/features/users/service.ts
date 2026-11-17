import 'server-only';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { KNOWN_ROLE_IDS, getRole } from '@/lib/access/roles';
import { ApiError, badRequest, forbidden, fromDbError, notFound } from '@/lib/api/errors';
import type { CreateUserInput, UpdateUserInput } from './schemas';
import type { TeamUser } from './types';

const BANNED_FOREVER = '876000h';

interface RoleRow {
  user_id: string;
  role_id: number;
  is_active: boolean;
  is_primary: boolean;
}

function pickRole(rows: RoleRow[]): RoleRow {
  return rows.find((r) => r.is_primary) ?? rows[0];
}

function isEditable(roleId: number): boolean {
  return getRole(roleId)?.assignable ?? false;
}

async function teamRoleRows(userIds?: string[]): Promise<Map<string, RoleRow>> {
  let query = supabaseAdmin
    .from('user_roles')
    .select('user_id, role_id, is_active, is_primary')
    .in('role_id', KNOWN_ROLE_IDS);
  if (userIds) query = query.in('user_id', userIds);

  const { data, error } = await query;
  if (error) throw fromDbError(error);

  const byUser = new Map<string, RoleRow[]>();
  for (const row of (data ?? []) as RoleRow[]) {
    byUser.set(row.user_id, [...(byUser.get(row.user_id) ?? []), row]);
  }
  return new Map([...byUser].map(([id, rows]) => [id, pickRole(rows)]));
}

async function toTeamUser(row: RoleRow, fullName: string): Promise<TeamUser | null> {
  const { data } = await supabaseAdmin.auth.admin.getUserById(row.user_id);
  const authUser = data?.user;
  if (!authUser) return null;

  return {
    id: row.user_id,
    email: authUser.email ?? '',
    fullName: fullName || String(authUser.user_metadata?.full_name ?? ''),
    roleId: row.role_id,
    roleLabel: getRole(row.role_id)?.label ?? `Role ${row.role_id}`,
    active: row.is_active,
    editable: isEditable(row.role_id),
    createdAt: authUser.created_at ?? null,
    lastSignInAt: authUser.last_sign_in_at ?? null,
  };
}

async function profileNames(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();
  const { data } = await supabaseAdmin.from('profiles').select('id, full_name').in('id', userIds);
  return new Map((data ?? []).map((p) => [p.id as string, (p.full_name as string) ?? '']));
}

export async function listTeamUsers(): Promise<TeamUser[]> {
  const rows = await teamRoleRows();
  const names = await profileNames([...rows.keys()]);
  const users = await Promise.all([...rows.values()].map((row) => toTeamUser(row, names.get(row.user_id) ?? '')));
  return users
    .filter((u): u is TeamUser => u !== null)
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

export async function getTeamUser(userId: string): Promise<TeamUser> {
  const row = (await teamRoleRows([userId])).get(userId);
  if (!row) throw notFound('User not found.');
  const user = await toTeamUser(row, (await profileNames([userId])).get(userId) ?? '');
  if (!user) throw notFound('User not found.');
  return user;
}

async function assignRole(userId: string, roleId: number, assignedBy: string, active = true): Promise<void> {
  const role = getRole(roleId);
  if (!role) throw badRequest('Unknown role.');

  const { error: clearError } = await supabaseAdmin
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .in('role_id', KNOWN_ROLE_IDS);
  if (clearError) throw fromDbError(clearError);

  const { error: insertError } = await supabaseAdmin.from('user_roles').insert({
    user_id: userId,
    role_id: roleId,
    is_primary: true,
    is_active: active,
    assigned_by: assignedBy,
  });
  if (insertError) throw fromDbError(insertError);

  await supabaseAdmin.from('profiles').update({ role_id: roleId, role_name: role.key }).eq('id', userId);
}

async function setActive(userId: string, active: boolean): Promise<void> {
  const { error } = await supabaseAdmin
    .from('user_roles')
    .update({ is_active: active })
    .eq('user_id', userId)
    .in('role_id', KNOWN_ROLE_IDS);
  if (error) throw fromDbError(error);

  await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: active ? 'none' : BANNED_FOREVER });
}

export async function createTeamUser(input: CreateUserInput, createdBy: string): Promise<TeamUser> {
  const role = getRole(input.roleId);
  if (!role?.assignable) throw forbidden('This role cannot be assigned here.');

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName, role_id: role.id, role_name: role.key },
  });
  if (error || !data.user) {
    const exists = /already (been )?registered|already exists/i.test(error?.message ?? '');
    throw new ApiError(exists ? 409 : 400, exists ? 'An account with this email already exists.' : error?.message || 'Could not create the user.');
  }

  const userId = data.user.id;
  try {
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert(
      { id: userId, email_address: input.email, full_name: input.fullName, role_id: role.id, role_name: role.key },
      { onConflict: 'id' },
    );
    if (profileError) throw fromDbError(profileError);
    await assignRole(userId, role.id, createdBy);
  } catch (e) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    throw e;
  }

  return getTeamUser(userId);
}

function assertManageable(target: TeamUser, actorId: string): void {
  if (target.id === actorId) throw forbidden('You cannot change your own account here.');
  if (!target.editable) throw forbidden(`${target.roleLabel} accounts cannot be changed here.`);
}

export async function updateTeamUser(userId: string, input: UpdateUserInput, actorId: string): Promise<TeamUser> {
  const target = await getTeamUser(userId);
  assertManageable(target, actorId);

  if (input.fullName !== undefined) {
    await supabaseAdmin.from('profiles').update({ full_name: input.fullName }).eq('id', userId);
  }
  if (input.password) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: input.password });
    if (error) throw badRequest(error.message);
  }
  if (input.roleId !== undefined && input.roleId !== target.roleId) {
    await assignRole(userId, input.roleId, actorId, target.active);
  }
  if (input.active !== undefined && input.active !== target.active) {
    await setActive(userId, input.active);
  }

  return getTeamUser(userId);
}

export async function deleteTeamUser(userId: string, actorId: string): Promise<void> {
  const target = await getTeamUser(userId);
  assertManageable(target, actorId);

  if (await hasOtherRoles(userId)) {
    const { error } = await supabaseAdmin.from('user_roles').delete().eq('user_id', userId).in('role_id', KNOWN_ROLE_IDS);
    if (error) throw fromDbError(error);
    return;
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) throw badRequest(error.message);
}

async function hasOtherRoles(userId: string): Promise<boolean> {
  const { count } = await supabaseAdmin
    .from('user_roles')
    .select('role_id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('role_id', 'in', `(${KNOWN_ROLE_IDS.join(',')})`);
  return (count ?? 0) > 0;
}
