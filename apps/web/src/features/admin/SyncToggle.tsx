import { RefreshCw } from 'lucide-react';
import { cn } from '../../components/ui/cn';
import { fr } from '../../i18n/fr';

/** "Synchro auto" switch (US-9); the icon spins while active. */
export function SyncToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border bg-surface px-2.5 text-sm font-medium text-fg hover:bg-surface-2 sm:pr-3"
    >
      <RefreshCw
        aria-hidden
        className={cn(
          'size-4',
          on ? 'animate-spin text-brand-blue-text [animation-duration:3s]' : 'text-fg-subtle',
        )}
      />
      <span className="hidden sm:inline">{fr.admin.sync}</span>
      <span
        aria-hidden
        className={cn(
          'relative h-5 w-9 rounded-full transition-colors',
          on ? 'bg-brand-blue' : 'bg-surface-3',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-card transition-transform',
            on && 'translate-x-4',
          )}
        />
      </span>
      <span className="sr-only">{fr.admin.sync}</span>
    </button>
  );
}
