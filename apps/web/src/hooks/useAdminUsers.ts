import type { CreateAdminUserDto, UpdateAdminUserDto } from '@hcc/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../lib/api';
import { ADMIN_ME_KEY } from './useAdmin';

export const ADMIN_USERS_KEY = ['admin', 'users'] as const;

export function useAdminUsers() {
  return useQuery({ queryKey: ADMIN_USERS_KEY, queryFn: adminApi.users });
}

export function useCreateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAdminUserDto) => adminApi.createUser(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_USERS_KEY }),
  });
}

export function useUpdateAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateAdminUserDto }) => adminApi.updateUser(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
      // My own email may have changed (header).
      void qc.invalidateQueries({ queryKey: ADMIN_ME_KEY });
    },
  });
}

export function useDeleteAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_USERS_KEY }),
  });
}
