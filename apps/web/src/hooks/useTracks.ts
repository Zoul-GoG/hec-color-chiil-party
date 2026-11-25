import type { PublicSort } from '@hcc/shared';
import { useInfiniteQuery } from '@tanstack/react-query';
import { PLAYLIST_PAGE_SIZE, POLL_INTERVAL_MS } from '../config';
import { api } from '../lib/api';

/** Public playlist, paginated by 24, polled every 15 s while the tab is visible. */
export function useTracks(sort: PublicSort) {
  return useInfiniteQuery({
    queryKey: ['tracks', sort],
    queryFn: ({ pageParam }) => api.tracks(sort, pageParam, PLAYLIST_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
  });
}
