import type { StatsDto } from '@hcc/shared';
import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { cn } from '../../components/ui/cn';
import { Skeleton } from '../../components/ui/Skeleton';
import { fr } from '../../i18n/fr';
import { formatTime } from '../../lib/format';

const PLOT_H = 160;

/**
 * Additions per time bucket (US-7): single-series bar chart, brand blue, current bucket red.
 * Hover/focus tooltip per bar, recessive axis, screen-reader table.
 */
export function AdditionsChart({ stats, loading }: { stats?: StatsDto; loading: boolean }) {
  const [active, setActive] = useState<number | null>(null);
  const data = stats?.timeline ?? [];
  const max = Math.max(1, ...data.map((d) => d.count));
  const bin =
    data.length > 1
      ? new Date(data[1].bucketStart).getTime() - new Date(data[0].bucketStart).getTime()
      : 15 * 60_000;
  const title = bin > 15 * 60_000 ? fr.dashboard.chartTitle30 : fr.dashboard.chartTitle;
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));

  return (
    <Card>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-display text-base font-semibold text-fg">{title}</h3>
        {data.length ? <span className="tabular text-xs text-fg-subtle">max {max}</span> : null}
      </div>
      {loading ? (
        <Skeleton className="mt-4 h-40 w-full" />
      ) : data.length === 0 ? (
        <p className="mt-4 text-sm text-fg-muted">{fr.dashboard.noData}</p>
      ) : (
        <>
          <div className="relative mt-4" onMouseLeave={() => setActive(null)}>
            <div
              aria-hidden
              className="absolute inset-x-0 border-t border-dashed border-border"
              style={{ top: 0 }}
            />
            <div className="flex items-end gap-0.5 border-b border-border" style={{ height: PLOT_H }}>
              {data.map((d, i) => {
                const last = i === data.length - 1;
                const h = d.count === 0 ? 0 : Math.max(4, (d.count / max) * PLOT_H);
                return (
                  <div
                    key={d.bucketStart}
                    tabIndex={0}
                    aria-label={`${formatTime(d.bucketStart)} : ${fr.dashboard.chartTooltip(d.count)}`}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    className="group relative flex h-full min-w-0 flex-1 cursor-default items-end justify-center rounded-sm focus-visible:outline-2"
                  >
                    <div
                      className={cn(
                        'w-full max-w-6 rounded-t-[4px] transition-opacity',
                        last ? 'bg-brand-red' : 'bg-brand-blue',
                        active !== null && active !== i && 'opacity-50',
                      )}
                      style={{ height: h }}
                    />
                    {active === i ? (
                      <div
                        role="tooltip"
                        className={cn(
                          'pointer-events-none absolute z-10 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs whitespace-nowrap text-fg shadow-float',
                          i > data.length / 2 ? 'right-0' : 'left-0',
                        )}
                        style={{ bottom: Math.min(h + 8, PLOT_H - 32) }}
                      >
                        <span className="text-fg-muted">{formatTime(d.bucketStart)}</span>{' '}
                        <span className="tabular font-semibold">{fr.dashboard.chartTooltip(d.count)}</span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div aria-hidden className="mt-1.5 flex gap-0.5">
              {data.map((d, i) => (
                <div
                  key={d.bucketStart}
                  className="tabular min-w-0 flex-1 text-center text-[10px] text-fg-subtle"
                >
                  {i % labelEvery === 0 ? formatTime(d.bucketStart) : ''}
                </div>
              ))}
            </div>
          </div>
          {/* sr-only on a wrapper: Firefox renders a <caption> outside a clipped <table>. */}
          <div className="sr-only">
            <table>
              <caption>{fr.dashboard.chartTableCaption}</caption>
              <thead>
                <tr>
                  <th>{fr.dashboard.chartColTime}</th>
                  <th>{fr.dashboard.chartColCount}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.bucketStart}>
                    <td>{formatTime(d.bucketStart)}</td>
                    <td>{d.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}
