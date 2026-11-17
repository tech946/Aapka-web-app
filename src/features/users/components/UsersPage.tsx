'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Pencil, Power, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, ConfirmDialog, DataTable, PageHeader, type Column } from '@/components/dashboard/kit';
import { useAccess } from '@/hooks/use-access';
import { PERMISSIONS } from '@/lib/access';
import { errorMessage } from '@/lib/api/client';
import { formatDate, formatDateTime } from '@/lib/format';
import { useDeleteUser, useTeamUsers, useUpdateUser } from '../hooks';
import type { TeamUser } from '../types';
import { EditUserModal } from './EditUserModal';

type PendingAction = { kind: 'toggle' | 'delete'; user: TeamUser } | null;

export function UsersPage() {
  const { user: me, can } = useAccess();
  const canWrite = can(PERMISSIONS.USERS_WRITE);
  const { data: users = [], isLoading, error } = useTeamUsers();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<TeamUser | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? users.filter((u) => `${u.fullName} ${u.email} ${u.roleLabel}`.toLowerCase().includes(q)) : users;
  }, [users, search]);

  const manageable = (u: TeamUser) => canWrite && u.editable && u.id !== me?.id;

  const confirmPending = async () => {
    if (!pending) return;
    const { kind, user } = pending;
    try {
      if (kind === 'delete') {
        await deleteUser.mutateAsync(user.id);
        toast.success(`${user.email} removed.`);
      } else {
        await updateUser.mutateAsync({ id: user.id, active: !user.active });
        toast.success(`${user.email} ${user.active ? 'deactivated' : 'activated'}.`);
      }
      setPending(null);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const columns: Column<TeamUser>[] = [
    {
      key: 'user',
      header: 'User',
      render: (u) => (
        <div className='dk-stack'>
          <strong>{u.fullName || u.email.split('@')[0]}</strong>
          <span className='dk-muted'>{u.email}</span>
        </div>
      ),
    },
    { key: 'role', header: 'Role', render: (u) => <Badge tone='brand'>{u.roleLabel}</Badge> },
    {
      key: 'status',
      header: 'Status',
      render: (u) => <Badge tone={u.active ? 'success' : 'neutral'}>{u.active ? 'Active' : 'Inactive'}</Badge>,
    },
    { key: 'lastSignIn', header: 'Last sign-in', render: (u) => formatDateTime(u.lastSignInAt, 'Never') },
    { key: 'created', header: 'Added', render: (u) => formatDate(u.createdAt) },
    {
      key: 'actions',
      header: '',
      className: 'table_cell_right',
      render: (u) =>
        manageable(u) ? (
          <div className='table_actions_row'>
            <button type='button' className='table_action_btn' title='Edit' onClick={() => setEditing(u)}>
              <Pencil aria-hidden />
            </button>
            <button
              type='button'
              className='table_action_btn'
              title={u.active ? 'Deactivate' : 'Activate'}
              onClick={() => setPending({ kind: 'toggle', user: u })}
            >
              <Power aria-hidden />
            </button>
            <button
              type='button'
              className='table_action_btn table_action_delete'
              title='Remove'
              onClick={() => setPending({ kind: 'delete', user: u })}
            >
              <Trash2 aria-hidden />
            </button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className='dashboard_page'>
      <PageHeader
        title='Users'
        description='Everyone who can sign in to the dashboard, and their role.'
        actions={
          canWrite && (
            <Link href='/dashboard/users/new' className='btn_primary'>
              <UserPlus size={15} aria-hidden /> Add user
            </Link>
          )
        }
      >
        <div className='table_search'>
          <input type='search' placeholder='Search name, email or role' value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </PageHeader>

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(u) => u.id}
        loading={isLoading}
        error={error ? errorMessage(error) : null}
        emptyMessage={search ? 'No users match your search.' : 'No team members yet.'}
      />

      {editing && <EditUserModal user={editing} onClose={() => setEditing(null)} />}

      {pending && (
        <ConfirmDialog
          title={pending.kind === 'delete' ? 'Remove user' : pending.user.active ? 'Deactivate user' : 'Activate user'}
          message={
            pending.kind === 'delete'
              ? `${pending.user.email} will lose dashboard access and their login will be deleted.`
              : pending.user.active
                ? `${pending.user.email} will not be able to sign in until reactivated.`
                : `${pending.user.email} will be able to sign in again.`
          }
          confirmLabel={pending.kind === 'delete' ? 'Remove' : pending.user.active ? 'Deactivate' : 'Activate'}
          danger={pending.kind === 'delete' || pending.user.active}
          busy={updateUser.isPending || deleteUser.isPending}
          onConfirm={confirmPending}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
}
