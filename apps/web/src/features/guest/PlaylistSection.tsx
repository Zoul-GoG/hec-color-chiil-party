import type { PublicSort, TrackDto } from '@hcc/shared';
import { AlertTriangle, Disc3, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { cn } from '../../components/ui/cn';
import { supportsIntersectionObserver, useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { useTracks } from '../../hooks/useTracks';
import { txt } from '../../i18n';
import { TrackCard, TrackCardSkeleton } from './TrackCard';

interface Props {
  highlightKey: string | null;
  onPlusOne: (track: TrackDto, origin: HTMLElement) => void;
  isPending: (deezerId: number) => boolean;
  onFocusSearch: () => void;
  readOnly?: boolean;
}

const TABS: { id: PublicSort; label: () => string }[] = [
  { id: 'popular', label: () => txt.playlist.popular },
  { id: 'recent', label: () => txt.playlist.recent },
];

/** US-4: guests' playlist with tabs, polling and infinite scroll (24 per page). */
export function PlaylistSection({
  highlightKey,
  onPlusOne,
  isPending,
  onFocusSearch,
  readOnly = false,
}: Props) {
  const [sort, setSort] = useState<PublicSort>('popular');
  const q = useTracks(sort);
  const tracks = q.data?.pages.flatMap((p) => p.items) ?? [];
  const total = q.data?.pages[0]?.total;
  // A failed page stops auto-loading until the guest taps "Réessayer" (no retry loop).
  const pageError = q.isFetchNextPageError;
  const sentinelRef = useInfiniteScroll<HTMLDivElement>(
    Boolean(q.hasNextPage) && !q.isFetchingNextPage && !pageError,
    () => void q.fetchNextPage(),
  );

  return (
    <section aria-labelledby="playlist-title" className="mt-14">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="size-2.5 shrink-0 rounded-full bg-brand-red" />
          <h2 id="playlist-title" className="font-display text-[22px] leading-7 font-bold text-fg">
            {txt.playlist.title}
          </h2>
          {total !== undefined ? (
            <span className="tabular text-sm text-fg-muted">{txt.playlist.count(total)}</span>
          ) : null}
        </div>
        <div
          role="tablist"
          aria-label={txt.playlist.tabsLabel}
          className="inline-flex self-start rounded-full border border-border bg-surface-2 p-1"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={sort === t.id}
              onClick={() => setSort(t.id)}
              className={cn(
                'inline-flex h-9 cursor-pointer items-center rounded-full px-3.5 text-sm font-semibold whitespace-nowrap transition-colors',
                sort === t.id ? 'bg-brand-red text-white shadow-card' : 'text-fg-muted hover:text-fg',
              )}
            >
              {t.label()}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {q.isPending ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <TrackCardSkeleton key={i} />
            ))}
          </div>
        ) : q.isError && tracks.length === 0 ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-6 text-center text-sm text-fg-muted sm:flex-row sm:justify-between sm:text-left"
          >
            <span className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-brand-red-text" aria-hidden />
              {txt.playlist.error}
            </span>
            <Button size="sm" onClick={() => void q.refetch()}>
              {txt.playlist.retry}
            </Button>
          </div>
        ) : tracks.length === 0 ? (
          <EmptyPlaylist onFocusSearch={readOnly ? undefined : onFocusSearch} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tracks.map((t, i) => (
                <TrackCard
                  key={t.trackKey}
                  track={t}
                  medal={sort === 'popular' ? i : undefined}
                  highlighted={t.trackKey === highlightKey}
                  pending={isPending(t.deezerId)}
                  onPlusOne={onPlusOne}
                  readOnly={readOnly}
                />
              ))}
            </div>
            <div ref={sentinelRef} className="mt-6 flex min-h-10 justify-center" aria-live="polite">
              {!q.hasNextPage ? (
                <p className="text-sm text-fg-subtle">{txt.playlist.end}</p>
              ) : q.isFetchingNextPage ? (
                <span className="inline-flex items-center gap-2 text-sm text-fg-muted">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  {txt.playlist.loadingMore}
                </span>
              ) : pageError ? (
                <Button size="sm" onClick={() => void q.fetchNextPage()}>
                  {txt.playlist.retry}
                </Button>
              ) : !supportsIntersectionObserver() ? (
                <Button onClick={() => void q.fetchNextPage()}>{txt.playlist.loadMore}</Button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function EmptyPlaylist({ onFocusSearch }: { onFocusSearch?: () => void }) {
  return (
    <div className="relative flex flex-col items-center overflow-hidden rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center">
      <div aria-hidden className="relative mb-4">
        <Disc3 className="size-14 text-brand-blue-text" />
        <span className="absolute -top-2 -left-3 size-2 rotate-12 rounded-[2px] bg-party-pink" />
        <span className="absolute -top-3 right-0 size-2 rounded-full bg-party-yellow" />
        <span className="absolute top-4 -right-4 size-2 -rotate-12 rounded-[2px] bg-party-green" />
        <span className="absolute bottom-0 -left-4 size-1.5 rounded-full bg-party-purple" />
        <span className="absolute -right-2 -bottom-2 size-1.5 rotate-45 rounded-[2px] bg-party-orange" />
      </div>
      <p className="font-display text-lg font-bold text-fg">{txt.playlist.emptyTitle}</p>
      {onFocusSearch ? (
        <>
          <p className="mt-1 text-sm text-fg-muted">{txt.playlist.emptyText}</p>
          <Button variant="primary" className="mt-5" onClick={onFocusSearch}>
            {txt.playlist.emptyCta}
          </Button>
        </>
      ) : null}
    </div>
  );
}
