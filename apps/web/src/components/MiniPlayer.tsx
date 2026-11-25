import { Pause, Play, X } from 'lucide-react';
import { useAudioPreview } from '../audio/AudioPreviewProvider';
import { fr } from '../i18n/fr';
import { TrackCover } from './TrackCover';

/** US-12: sticky mini-player on mobile while a preview plays. */
export function MiniPlayer() {
  const { state, togglePause, stop } = useAudioPreview();
  if (!state.currentKey || !state.meta) return null;
  const playing = state.status === 'playing' || state.status === 'loading';
  return (
    <div
      role="region"
      aria-label={fr.player.label}
      className="animate-fade-in fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 shadow-float backdrop-blur sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="h-0.5 w-full bg-surface-3">
        <div className="h-full bg-brand-red" style={{ width: `${Math.round(state.progress * 100)}%` }} />
      </div>
      <div className="flex items-center gap-3 px-4 py-2">
        <TrackCover src={state.meta.cover} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-semibold text-fg">{state.meta.title}</p>
          <p className="truncate text-xs text-fg-muted">{state.meta.artist}</p>
        </div>
        <button
          type="button"
          onClick={togglePause}
          aria-label={playing ? fr.player.pause : fr.player.play}
          className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full bg-brand-red text-white"
        >
          {playing ? (
            <Pause className="size-5 fill-current" aria-hidden />
          ) : (
            <Play className="size-5 translate-x-px fill-current" aria-hidden />
          )}
        </button>
        <button
          type="button"
          onClick={stop}
          aria-label={fr.player.close}
          className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-fg-muted hover:bg-surface-2"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
