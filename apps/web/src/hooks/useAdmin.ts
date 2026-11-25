import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../lib/api';

export const ADMIN_ME_KEY = ['admin', 'me'] as const;

/** Current admin session (GET /api/admin/auth/me); 401 → data undefined, isError. */
export function useAdminMe() {
  return useQuery({ queryKey: ADMIN_ME_KEY, queryFn: adminApi.me, retry: false, staleTime: 60_000 });
}

export function useLogout() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => adminApi.logout(),
    onSettled: () => {
      qc.removeQueries({ queryKey: ['admin'] });
      navigate('/admin/login', { replace: true });
    },
  });
}
