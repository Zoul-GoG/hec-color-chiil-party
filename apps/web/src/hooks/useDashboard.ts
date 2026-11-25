import type {
  AdminSort,
  AdminTrackPatchDto,
  AdminTracksQuery,
  AdminTracksResponseDto,
  Range,
} from '@hcc/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ADMIN_PAGE_SIZE, POLL_INTERVAL_MS } from '../config';
import { fr } from '../i18n/fr';
import { adminApi } from '../lib/api';

export interface DashboardFilters {
  q: string;
  genre: string;
  sort: AdminSort;
  range: Range;
  page: number;
}

const SORTS: AdminSort[] = ['count_desc', 'count_asc', 'recent', 'alpha'];
const pick = <T extends string>(v: string | null, allowed: T[], fallback: T): T =>
  v && (allowed as string[]).includes(v) ? (v as T) : fallback;

/** Filters live in the URL (?q=&genre=&sort=&range=&page=…) so a refresh keeps them (docs/07 §3.4). */
export function useDashboardFilters() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo<DashboardFilters>(
    () => ({
      q: params.get('q') ?? '',
      genre: params.get('genre') ?? '',
      sort: pick(params.get('sort'), SORTS, 'count_desc'),
      range: params.get('range') === '1h' ? '1h' : 'all',
      page: Math.max(1, Number(params.get('page')) || 1),
    }),
    [params],
  );

  const update = useCallback(
    (patch: Partial<DashboardFilters>) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          const merged = { ...Object.fromEntries(prev), ...patch } as Record<string, unknown>;
          // Drop legacy params (removed status / explicit filters) from old bookmarked URLs.
          next.delete('status');
          next.delete('explicit');
          if (!('page' in patch)) merged.page = 1;
          const defaults: Record<string, unknown> = {
            q: '',
            genre: '',
            sort: 'count_desc',
            range: 'all',
            page: 1,
          };
          for (const k of Object.keys(defaults)) {
            const v = merged[k];
            if (v === undefined || v === '' || String(v) === String(defaults[k])) next.delete(k);
            else next.set(k, String(v));
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const reset = useCallback(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams();
        const range = prev.get('range');
        if (range) next.set('range', range);
        return next;
      },
      { replace: true },
    );
  }, [setParams]);

  return { filters, update, reset };
}

/** US-9: the dashboard always refreshes every 15 s while the tab is visible. */
export function useStats(range: Range) {
  return useQuery({
    queryKey: ['admin', 'stats', range],
    queryFn: () => adminApi.stats(range),
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
}

export function toQuery(f: DashboardFilters): AdminTracksQuery {
  return {
    q: f.q || undefined,
    genre: f.genre || undefined,
    sort: f.sort,
    range: f.range,
    page: f.page,
    limit: ADMIN_PAGE_SIZE,
  };
}

export function useAdminTracks(f: DashboardFilters) {
  const query = toQuery(f);
  return useQuery({
    queryKey: ['admin', 'tracks', query],
    queryFn: () => adminApi.tracks(query),
    placeholderData: keepPreviousData,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
}

/** Optimistic played/hidden toggle with rollback + toast on error (docs/07 §3.4). */
export function usePatchTrack() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ trackKey, patch }: { trackKey: string; patch: AdminTrackPatchDto }) =>
      adminApi.patchTrack(trackKey, patch),
    onMutate: async ({ trackKey, patch }) => {
      await qc.cancelQueries({ queryKey: ['admin', 'tracks'] });
      const snapshot = qc.getQueriesData<AdminTracksResponseDto>({ queryKey: ['admin', 'tracks'] });
      qc.setQueriesData<AdminTracksResponseDto>({ queryKey: ['admin', 'tracks'] }, (old) =>
        old
          ? {
              ...old,
              items: old.items.map((t) =>
                t.trackKey === trackKey
                  ? {
                      ...t,
                      ...patch,
                      playedAt:
                        patch.played === undefined
                          ? t.playedAt
                          : patch.played
                            ? new Date().toISOString()
                            : null,
                    }
                  : t,
              ),
            }
          : old,
      );
      return { snapshot };
    },
    onError: (_e, _v, ctx) => {
      ctx?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(fr.dashboard.actionError);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ['admin'] });
      void qc.invalidateQueries({ queryKey: ['tracks'] });
    },
  });
}
