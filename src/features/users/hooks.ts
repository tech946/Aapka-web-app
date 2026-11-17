'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { CreateUserInput, UpdateUserInput } from './schemas';
import type { TeamUser } from './types';

const ENDPOINT = '/api/dashboard/users';
const usersKey = ['dashboard', 'users'] as const;

export function useTeamUsers() {
  return useQuery({
    queryKey: usersKey,
    queryFn: () => api.get<{ users: TeamUser[] }>(ENDPOINT).then((r) => r.users),
    staleTime: 30_000,
    refetchOnMount: true,
  });
}

function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: usersKey });
}

export function useCreateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (input: CreateUserInput) => api.post<{ user: TeamUser }>(ENDPOINT, input).then((r) => r.user),
    onSuccess: invalidate,
  });
}

export function useUpdateUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ id, ...input }: UpdateUserInput & { id: string }) =>
      api.patch<{ user: TeamUser }>(`${ENDPOINT}/${id}`, input).then((r) => r.user),
    onSuccess: invalidate,
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (id: string) => api.delete(`${ENDPOINT}/${id}`),
    onSuccess: invalidate,
  });
}
