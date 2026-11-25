import type { TrackDto } from '@hcc/shared';
import { useEffect, useRef } from 'react';
import { PreviewButton } from '../../components/PreviewButton';
import { TrackCover } from '../../components/TrackCover';
import { Badge, ExplicitBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { cn } from '../../components/ui/cn';
import { CountBadge } from '../../components/ui/CountBadge';
import { fr } from '../../i18n/fr';
import { api } from '../../lib/api';
import { formatDuration, prefersReducedMotion } from '../../lib/format';

interface Props {
  track: TrackDto;
  /** 0-based position in the "popular" ranking; medals for 0..2. */
  medal?: number;
  highlighted: boolean;
  pending: boolean;
  onPlusOne: (track: TrackDto, origin: HTMLElement) => void;
}

export function TrackCard({ track, medal, highlighted, pending, onPlusOne }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!highlighted || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const visible = r.bottom > 0 && r.top < window.innerHeight;
    if (visible)
      ref.current.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [highlighted]);

  return (
    <article
      ref={ref}
      aria-label={`${track.title} — ${track.artist}`}
      className={cn(
        'flex flex-col rounded-lg border border-border bg-surface p-4 shadow-card transition-shadow sm:hover:shadow-float',
        highlighted && 'ring-2 ring-brand-red',
      )}
    >
      <div className="flex items-start gap-3">
        <TrackCover src={track.coverSmall} size={56}>
          <span className="tabular absolute right-0.5 bottom-0.5 rounded-sm bg-black/70 px-1 text-[10px] leading-4 font-semibold text-white">
            {formatDuration(track.duration)}
          </span>
          {medal !== undefined && medal < 3 ? (
            <span
              className="absolute -top-0.5 -left-0.5 text-lg leading-none drop-shadow"
              role="img"
              aria-label={fr.track.rankAria(medal + 1)}
            >
              {fr.track.medal[medal]}
            </span>
          ) : null}
        </TrackCover>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base leading-[22px] font-semibold text-fg">
            {track.title}
          </h3>
          <p className="truncate text-sm text-fg-muted">{track.artist}</p>
          <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
            {track.genre ? (
              <Badge variant="blue" className="max-w-full truncate">
                {track.genre}
              </Badge>
            ) : null}
            {track.explicit ? <ExplicitBadge label={fr.track.explicit} /> : null}
          </div>
        </div>
        <CountBadge count={track.addCount} />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <PreviewButton
          trackKey={track.trackKey}
          title={track.title}
          available={track.hasPreview}
          label={fr.track.preview}
          source={() => ({
            resolve: () => api.preview(track.trackKey, track.deezerId).then((r) => r.previewUrl),
          })}
        />
        {track.addedByMe ? (
          <Badge variant="blue" className="h-8 px-3">
            {fr.track.addedByMe}
          </Badge>
        ) : (
          <Button
            variant="primary"
            size="sm"
            loading={pending}
            aria-label={fr.track.plusOneAria(track.title)}
            onClick={(e) => onPlusOne(track, e.currentTarget)}
          >
            <span className="tabular">+1</span> {fr.track.plusOne}
          </Button>
        )}
      </div>
    </article>
  );
}

export function TrackCardSkeleton() {
  return (
    <div aria-hidden className="rounded-lg border border-border bg-surface p-4 shadow-card">
      <div className="flex gap-3">
        <div className="size-14 animate-pulse rounded-md bg-surface-3" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 w-2/3 animate-pulse rounded-md bg-surface-3" />
          <div className="h-3 w-1/3 animate-pulse rounded-md bg-surface-3" />
        </div>
      </div>
      <div className="mt-6 h-8 animate-pulse rounded-md bg-surface-3" />
    </div>
  );
}
