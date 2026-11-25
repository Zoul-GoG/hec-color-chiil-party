import { Pause, Play } from 'lucide-react';
import { useAudioPreview, type PreviewSource } from '../audio/AudioPreviewProvider';
import { txt } from '../i18n';
import { cn } from './ui/cn';
import { Spinner } from './ui/Spinner';

const R = 18;
const C = 2 * Math.PI * R;

/** Round ▶/⏸ with a 30 s progress ring (docs/06 §6). */
export function PreviewButton({
  trackKey,
  title,
  available,
  source,
  label,
}: {
  trackKey: string;
  title: string;
  available: boolean;
  source: () => PreviewSource;
  /** Optional text label shown next to the button from 640 px. */
  label?: string;
}) {
  const { state, toggle } = useAudioPreview();
  const current = state.currentKey === trackKey;
  const playing = current && (state.status === 'playing' || state.status === 'loading');
  const ariaLabel = !available
    ? txt.track.noPreview
    : playing
      ? txt.track.pauseAria
      : txt.track.playAria(title);
  return (
    <button
      type="button"
      disabled={!available}
      aria-label={ariaLabel}
      title={!available ? txt.track.noPreview : undefined}
      aria-pressed={playing}
      onClick={() => toggle(trackKey, source())}
      className={cn(
        'group inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full text-sm font-semibold text-fg',
        'disabled:cursor-not-allowed disabled:opacity-40',
        label && 'sm:pr-3 sm:hover:bg-surface-2',
      )}
    >
      <span className="relative inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface-2 group-hover:bg-surface-3">
        {current ? (
          <svg aria-hidden viewBox="0 0 40 40" className="absolute inset-0 size-10 -rotate-90">
            <circle
              cx="20"
              cy="20"
              r={R}
              fill="none"
              stroke="var(--hec-red)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - state.progress)}
            />
          </svg>
        ) : null}
        {current && state.status === 'loading' ? (
          <Spinner />
        ) : playing ? (
          <Pause className="size-4 fill-current" aria-hidden />
        ) : (
          <Play className="size-4 translate-x-px fill-current" aria-hidden />
        )}
      </span>
      {label ? <span className="hidden sm:inline">{label}</span> : null}
    </button>
  );
}
