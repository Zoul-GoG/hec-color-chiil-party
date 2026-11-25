import type { StatsDto } from '@hcc/shared';
import {
  AlertTriangle,
  Clock,
  Disc3,
  ListMusic,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '../../components/ui/Card';
import { cn } from '../../components/ui/cn';
import { Skeleton } from '../../components/ui/Skeleton';
import { genreLabel, locale, OTHER_GENRE, txt } from '../../i18n';

// Formatters follow the current UI language (read at render time).
const nf = { format: (v: number) => new Intl.NumberFormat(locale()).format(v) };
const nf1 = {
  format: (v: number) =>
    new Intl.NumberFormat(locale(), { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(v),
};
const pf = {
  format: (v: number) =>
    new Intl.NumberFormat(locale(), { style: 'percent', maximumFractionDigits: 0 }).format(v),
};

interface Props {
  stats?: StatsDto;
  loading: boolean;
  error: boolean;
}

function Kpi({
  label,
  icon: Icon,
  value,
  detail,
  loading,
  error,
}: {
  label: string;
  icon: LucideIcon;
  value?: number;
  detail?: ReactNode;
  loading: boolean;
  error: boolean;
}) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[11px] leading-[14px] font-bold tracking-[0.06em] text-fg-muted uppercase">
          {label}
        </h3>
        <Icon className="size-4 shrink-0 text-brand-blue-text" aria-hidden />
      </div>
      {loading ? (
        <Skeleton className="h-9 w-20" />
      ) : error || value === undefined ? (
        <p
          className="flex items-center gap-2 font-display text-3xl font-bold text-fg-subtle"
          title={txt.dashboard.kpi.error}
        >
          — <AlertTriangle className="size-5 text-brand-red-text" aria-label={txt.dashboard.kpi.error} />
        </p>
      ) : (
        <p className="tabular font-display text-3xl leading-9 font-bold text-fg">{nf.format(value)}</p>
      )}
      <div className="min-h-5 text-xs text-fg-muted">{!loading && !error ? detail : null}</div>
    </Card>
  );
}

function Variation({ last, prev }: { last: number; prev: number }) {
  if (prev === 0) return null;
  const delta = (last - prev) / prev;
  const up = delta >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          'tabular inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold',
          up ? 'bg-party-green/15 text-fg' : 'bg-brand-red-soft text-brand-red-text',
        )}
      >
        <Icon className={cn('size-3.5', up ? 'text-party-green' : '')} aria-hidden />
        {up ? '+' : '−'}
        {pf.format(Math.abs(delta))}
      </span>
      {txt.dashboard.kpi.vsPrev}
    </span>
  );
}

/** US-7 KPI grid: 2 cols mobile, 4 cols desktop. */
export function KpiCards({ stats, loading, error }: Props) {
  const k = txt.dashboard.kpi;
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <Kpi label={k.uniqueTracks} icon={Disc3} value={stats?.uniqueTracks} loading={loading} error={error} />
      <Kpi
        label={k.totalAdditions}
        icon={ListMusic}
        value={stats?.totalAdditions}
        loading={loading}
        error={error}
        detail={
          stats && stats.uniqueTracks > 0
            ? k.avg(nf1.format(stats.totalAdditions / stats.uniqueTracks))
            : null
        }
      />
      <Kpi label={k.uniqueGuests} icon={Users} value={stats?.uniqueGuests} loading={loading} error={error} />
      <Kpi
        label={k.lastHour}
        icon={Clock}
        value={stats?.additionsLastHour}
        loading={loading}
        error={error}
        detail={stats ? <Variation last={stats.additionsLastHour} prev={stats.additionsPrevHour} /> : null}
      />
    </div>
  );
}

const GENRE_COLORS = ['bg-brand-blue', 'bg-brand-red', 'bg-party-pink', 'bg-party-purple'];
const OTHER_COLOR = 'bg-fg-subtle';

export function TopArtistCard({ stats, loading }: { stats?: StatsDto; loading: boolean }) {
  return (
    <Card className="flex flex-col gap-2">
      <h3 className="text-[11px] leading-[14px] font-bold tracking-[0.06em] text-fg-muted uppercase">
        {txt.dashboard.topArtist}
      </h3>
      {loading ? (
        <Skeleton className="h-7 w-40" />
      ) : stats?.topArtist ? (
        <>
          <p className="truncate font-display text-[22px] leading-7 font-bold text-fg">
            {stats.topArtist.name}
          </p>
          <p className="tabular text-sm text-fg-muted">
            {txt.dashboard.topArtistCount(stats.topArtist.count)}
          </p>
        </>
      ) : (
        <p className="text-sm text-fg-muted">{txt.dashboard.noData}</p>
      )}
    </Card>
  );
}

/** Stacked share bar (top 4 + "Autres") with a legend carrying names and %. */
export function GenreCard({ stats, loading }: { stats?: StatsDto; loading: boolean }) {
  const genres = stats?.genres ?? [];
  let ci = 0;
  const colored = genres.map((g) => ({
    ...g,
    color: g.name === OTHER_GENRE ? OTHER_COLOR : GENRE_COLORS[ci++ % GENRE_COLORS.length],
  }));
  return (
    <Card className="flex flex-col gap-3">
      <h3 className="text-[11px] leading-[14px] font-bold tracking-[0.06em] text-fg-muted uppercase">
        {txt.dashboard.genres}
      </h3>
      {loading ? (
        <Skeleton className="h-3 w-full" />
      ) : colored.length === 0 ? (
        <p className="text-sm text-fg-muted">{txt.dashboard.noData}</p>
      ) : (
        <>
          <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full" aria-hidden>
            {colored.map((g) => (
              <div
                key={g.name}
                className={cn('h-full first:rounded-l-full last:rounded-r-full', g.color)}
                style={{ width: `${g.share * 100}%` }}
                title={`${genreLabel(g.name)} · ${pf.format(g.share)}`}
              />
            ))}
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
            {colored.map((g) => (
              <li key={g.name} className="flex min-w-0 items-center gap-1.5">
                <span aria-hidden className={cn('size-2.5 shrink-0 rounded-full', g.color)} />
                <span className="truncate text-fg">{genreLabel(g.name)}</span>
                <span className="tabular text-fg-muted">{pf.format(g.share)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
