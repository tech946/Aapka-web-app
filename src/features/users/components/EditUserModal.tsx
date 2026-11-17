'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Field, Modal } from '@/components/dashboard/kit';
import { errorMessage } from '@/lib/api/client';
import { fieldErrors, type FieldErrors } from '@/lib/forms';
import { updateUserSchema } from '../schemas';
import { useUpdateUser } from '../hooks';
import type { TeamUser } from '../types';
import { RoleSelect, roleDescription } from './RoleSelect';

export function EditUserModal({ user, onClose }: { user: TeamUser; onClose: () => void }) {
  const updateUser = useUpdateUser();
  const [fullName, setFullName] = useState(user.fullName);
  const [roleId, setRoleId] = useState<number>(user.roleId);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});

  const save = async () => {
    const parsed = updateUserSchema.safeParse({
      fullName,
      roleId,
      password: password || undefined,
      confirmPassword: password ? confirmPassword : undefined,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    try {
      await updateUser.mutateAsync({ id: user.id, ...parsed.data });
      toast.success('User updated.');
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not update the user.'));
    }
  };

  return (
    <Modal
      title={`Edit ${user.email}`}
      onClose={onClose}
      footer={
        <>
          <button type='button' className='btn_secondary' onClick={onClose}>
            Cancel
          </button>
          <button type='button' className='btn_primary' onClick={save} disabled={updateUser.isPending}>
            {updateUser.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </>
      }
    >
      <Field label='Full name' htmlFor='edit-name' error={errors.fullName}>
        <input id='edit-name' value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </Field>
      <Field label='Role' htmlFor='edit-role' error={errors.roleId} hint={roleDescription(roleId)}>
        <RoleSelect id='edit-role' value={roleId} onChange={setRoleId} />
      </Field>
      <Field label='New password' htmlFor='edit-password' error={errors.password} hint='Leave empty to keep the current password'>
        <input
          id='edit-password'
          type='password'
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete='new-password'
        />
      </Field>
      {password && (
        <Field label='Confirm new password' htmlFor='edit-confirm' error={errors.confirmPassword}>
          <input
            id='edit-confirm'
            type='password'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete='new-password'
          />
        </Field>
      )}
    </Modal>
  );
}
