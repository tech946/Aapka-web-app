'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Field, PageHeader } from '@/components/dashboard/kit';
import { errorMessage } from '@/lib/api/client';
import { fieldErrors, type FieldErrors } from '@/lib/forms';
import { PASSWORD_MIN_LENGTH, createUserSchema } from '../schemas';
import { useCreateUser } from '../hooks';
import { RoleSelect, roleDescription } from './RoleSelect';

const EMPTY = { fullName: '', email: '', password: '', confirmPassword: '', roleId: '' as number | '' };

export function CreateUserForm() {
  const router = useRouter();
  const createUser = useCreateUser();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors(({ [key]: _, ...rest }) => rest);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = createUserSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    try {
      const user = await createUser.mutateAsync(parsed.data);
      toast.success(`${user.email} can now sign in as ${user.roleLabel}.`);
      router.push('/dashboard/users');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not create the user.'));
    }
  };

  return (
    <div className='dashboard_page'>
      <PageHeader title='Add team member' description='Create a dashboard login. The role decides what they can see and do.' />

      <form className='dk-card dk-form' onSubmit={onSubmit} noValidate>
        <Field label='Full name' htmlFor='fullName' error={errors.fullName}>
          <input id='fullName' value={values.fullName} onChange={(e) => set('fullName', e.target.value)} autoComplete='off' />
        </Field>

        <Field label='Email' htmlFor='email' error={errors.email} required>
          <input
            id='email'
            type='email'
            value={values.email}
            onChange={(e) => set('email', e.target.value)}
            autoComplete='off'
          />
        </Field>

        <div className='dk-form__row'>
          <Field
            label='Password'
            htmlFor='password'
            error={errors.password}
            hint={`At least ${PASSWORD_MIN_LENGTH} characters`}
            required
          >
            <input
              id='password'
              type='password'
              value={values.password}
              onChange={(e) => set('password', e.target.value)}
              autoComplete='new-password'
            />
          </Field>
          <Field label='Confirm password' htmlFor='confirmPassword' error={errors.confirmPassword} required>
            <input
              id='confirmPassword'
              type='password'
              value={values.confirmPassword}
              onChange={(e) => set('confirmPassword', e.target.value)}
              autoComplete='new-password'
            />
          </Field>
        </div>

        <Field label='Role' htmlFor='roleId' error={errors.roleId} hint={roleDescription(values.roleId)} required>
          <RoleSelect id='roleId' value={values.roleId} onChange={(id) => set('roleId', id)} />
        </Field>

        <div className='dk-form__actions'>
          <Link href='/dashboard/users' className='btn_secondary'>
            Cancel
          </Link>
          <button type='submit' className='btn_primary' disabled={createUser.isPending}>
            {createUser.isPending ? 'Creating…' : 'Create user'}
          </button>
        </div>
      </form>
    </div>
  );
}
