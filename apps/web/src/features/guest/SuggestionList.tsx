import type { SearchResultDto } from '@hcc/shared';
import { AlertTriangle, Plus } from 'lucide-react';
import { PreviewButton } from '../../components/PreviewButton';
import { TrackCover } from '../../components/TrackCover';
import { Badge, ExplicitBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { fr } from '../../i18n/fr';
import { api } from '../../lib/api';
import { errorCode } from '../../lib/errors';
import { formatDuration } from '../../lib/format';
import { SUGGESTIONS_ID } from './SearchBox';

interface Props {
  query: string;
  items: SearchResultDto[] | undefined;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  onAdd: (item: SearchResultDto, origin: HTMLElement) => void;
  isPending: (deezerId: number) => boolean;
}

/** In-flow suggestions panel (docs/07 §1.4). */
export function SuggestionList({ query, items, isLoading, error, onRetry, onAdd, isPending }: Props) {
  return (
    <section
      id={SUGGESTIONS_ID}
      aria-label={fr.search.resultsHeader}
      aria-busy={isLoading}
      className="animate-fade-in mt-3 rounded-lg border border-border bg-surface p-2 shadow-float sm:p-3"
    >
      <div className="flex items-center justify-between px-2 pt-1 pb-2">
        <h2 className="text-[11px] leading-[14px] font-bold tracking-[0.06em] text-fg-muted">
          {fr.search.resultsHeader}
        </h2>
        {items && !isLoading ? (
          <span className="tabular text-xs font-medium text-brand-blue-text">
            {fr.search.resultsCount(items.length)}
          </span>
        ) : null}
      </div>
      {isLoading ? (
        <ul aria-label={fr.search.loading}>
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="flex h-16 items-center gap-3 px-2">
              <Skeleton className="size-12" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="size-10 rounded-full" />
            </li>
          ))}
        </ul>
      ) : error ? (
        <SearchError error={error} onRetry={onRetry} />
      ) : items && items.length === 0 ? (
        <p className="px-2 py-6 text-center text-sm text-fg-muted">{fr.search.empty(query)}</p>
      ) : (
        <ul className="divide-y divide-border">
          {items?.map((item) => (
            <SuggestionRow key={item.trackKey} item={item} onAdd={onAdd} pending={isPending(item.deezerId)} />
          ))}
        </ul>
      )}
    </section>
  );
}

function SearchError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const code = errorCode(error);
  const message =
    code === 'RATE_LIMITED'
      ? fr.errors.RATE_LIMITED
      : code === 'VALIDATION_ERROR'
        ? fr.errors.VALIDATION_ERROR
        : fr.errors.DEEZER_UNAVAILABLE;
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 px-2 py-6 text-center text-sm text-fg-muted"
    >
      <AlertTriangle className="size-6 text-brand-red-text" aria-hidden />
      <p>{message}</p>
      <Button size="sm" onClick={onRetry}>
        {fr.search.retry}
      </Button>
    </div>
  );
}

function SuggestionRow({
  item,
  onAdd,
  pending,
}: {
  item: SearchResultDto;
  onAdd: Props['onAdd'];
  pending: boolean;
}) {
  return (
    <li className="flex min-h-16 items-center gap-3 rounded-md px-2 py-2 hover:bg-surface-2">
      <TrackCover src={item.coverSmall} size={48} />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="truncate font-display text-base leading-[22px] font-semibold text-fg">{item.title}</p>
          {item.explicit ? <ExplicitBadge label={fr.track.explicit} /> : null}
        </div>
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm text-fg-muted">
            {item.artist} · <span className="tabular">{formatDuration(item.duration)}</span>
          </p>
          {item.addCount > 0 && !item.addedByMe ? (
            <Badge variant="red" className="max-[399px]:hidden">
              {fr.track.alreadyAdded(item.addCount)}
            </Badge>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <PreviewButton
          trackKey={item.trackKey}
          title={item.title}
          available={Boolean(item.previewUrl)}
          label={fr.track.preview}
          source={() => ({
            url: item.previewUrl,
            resolve: () => api.preview(item.trackKey, item.deezerId).then((r) => r.previewUrl),
            meta: { title: item.title, artist: item.artist, cover: item.coverSmall },
          })}
        />
        {item.addedByMe ? (
          <Badge variant="blue" className="h-10 px-3">
            {fr.track.addedByMe}
          </Badge>
        ) : (
          <Button
            variant="primary"
            size="icon"
            loading={pending}
            aria-label={fr.track.addAria(item.title)}
            onClick={(e) => onAdd(item, e.currentTarget)}
            className="sm:w-auto sm:gap-1.5 sm:rounded-md! sm:px-4 sm:text-sm"
          >
            {pending ? null : <Plus className="size-5 shrink-0 sm:size-4" aria-hidden />}
            <span className="hidden sm:inline">{fr.track.add}</span>
          </Button>
        )}
      </div>
    </li>
  );
}
