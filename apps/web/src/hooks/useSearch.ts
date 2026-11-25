import { useQuery } from '@tanstack/react-query';
import { SEARCH_MIN_CHARS, SEARCH_STALE_MS } from '../config';
import { api } from '../lib/api';

export const searchKey = (q: string) => ['search', q] as const;

/** Deezer search through our API; the previous request is aborted when q changes. */
export function useSearch(q: string) {
  const term = q.trim();
  return useQuery({
    queryKey: searchKey(term),
    queryFn: ({ signal }) => api.search(term, signal),
    enabled: term.length >= SEARCH_MIN_CHARS,
    staleTime: SEARCH_STALE_MS,
    retry: false,
  });
}
