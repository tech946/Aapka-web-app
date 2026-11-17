import { z } from 'zod';
import { ASSIGNABLE_ROLES } from '@/lib/access/roles';

export const PASSWORD_MIN_LENGTH = 8;

const assignableRoleId = z.coerce
  .number()
  .refine((id) => ASSIGNABLE_ROLES.some((r) => r.id === id), 'Choose a valid role');

const password = z.string().min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters`).max(72);

export const createUserSchema = z
  .object({
    fullName: z.string().trim().max(120).optional().default(''),
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    password,
    confirmPassword: z.string(),
    roleId: assignableRoleId,
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export const updateUserSchema = z
  .object({
    fullName: z.string().trim().max(120).optional(),
    roleId: assignableRoleId.optional(),
    active: z.boolean().optional(),
    password: password.optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((v) => !v.password || v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
