import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { POLL_INTERVAL_MS } from '../config';
import { fr } from '../i18n/fr';
import { adminApi, api } from '../lib/api';
import { errorMessage } from '../lib/errors';

export const SETTINGS_KEY = ['settings'] as const;

/** US-11 — tolerant: if the route fails, submissions are considered open. */
export function useSubmissionsOpen(): boolean {
  const q = useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: api.settings,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    retry: false,
  });
  return q.data?.submissionsOpen ?? true;
}

export function useToggleSubmissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (open: boolean) => adminApi.setSubmissionsOpen(open),
    onSuccess: (res) => {
      qc.setQueryData(SETTINGS_KEY, (old: object | undefined) => ({ ...(old ?? {}), ...res }));
      toast.success(res.submissionsOpen ? fr.closed.openedToast : fr.closed.closedToast);
    },
    onError: (e) => toast.error(errorMessage(e)),
    onSettled: () => void qc.invalidateQueries({ queryKey: SETTINGS_KEY }),
  });
}
