import type { Range } from '@hcc/shared';
import { cn } from '../../components/ui/cn';
import { useNow } from '../../hooks/useNow';
import { fr } from '../../i18n/fr';

export function DashboardBanner({
  range,
  onRange,
  generatedAt,
}: {
  range: Range;
  onRange: (r: Range) => void;
  generatedAt?: string;
}) {
  const now = useNow();
  const ago = generatedAt ? Math.max(0, Math.round((now - new Date(generatedAt).getTime()) / 1000)) : null;
  return (
    <section className="bg-gradient-hec rounded-xl p-5 text-white shadow-float sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2 text-[11px] leading-[14px] font-bold tracking-[0.06em]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1">
              <span aria-hidden className="size-2 animate-pulse rounded-full bg-white" />
              {fr.dashboard.live}
            </span>
            <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-1">
              {fr.dashboard.place}
            </span>
          </div>
          <h1 className="mt-3 font-display text-[26px] leading-8 font-bold sm:text-[32px] sm:leading-10">
            {fr.dashboard.title}
          </h1>
          <p className="mt-1 text-sm text-white/85 sm:text-base">{fr.dashboard.subtitle}</p>
        </div>
        <div className="flex flex-col items-start gap-2 lg:items-end">
          <div
            role="radiogroup"
            aria-label={fr.dashboard.periodLabel}
            className="inline-flex rounded-full bg-white/15 p-1"
          >
            {(['all', '1h'] as const).map((r) => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={range === r}
                onClick={() => onRange(r)}
                className={cn(
                  'h-9 cursor-pointer rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors',
                  range === r ? 'bg-white text-brand-blue shadow-card' : 'text-white hover:bg-white/10',
                )}
              >
                {r === 'all' ? fr.dashboard.rangeAll : fr.dashboard.range1h}
              </button>
            ))}
          </div>
          {ago !== null ? (
            <p className="tabular text-xs text-white/80" aria-live="off">
              {fr.dashboard.updated(ago)}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
