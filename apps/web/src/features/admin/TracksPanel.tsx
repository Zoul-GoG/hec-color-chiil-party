import type { AdminSort, AdminStatus, AdminTrackDto } from '@hcc/shared';
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Link2, MoreHorizontal, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { PreviewButton } from '../../components/PreviewButton';
import { TrackCover } from '../../components/TrackCover';
import { Badge, ExplicitBadge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { cn } from '../../components/ui/cn';
import { Skeleton } from '../../components/ui/Skeleton';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useAdminTracks, usePatchTrack, type DashboardFilters } from '../../hooks/useDashboard';
import { fr } from '../../i18n/fr';
import { api } from '../../lib/api';
import { formatTime } from '../../lib/format';

const d = fr.dashboard;
const MEDALS = fr.track.medal;

interface Props {
  filters: DashboardFilters;
  update: (patch: Partial<DashboardFilters>) => void;
  reset: () => void;
  autoSync: boolean;
}

/** US-8: filterable ranking (docs/07 §3.4). */
export function TracksPanel({ filters, update, reset, autoSync }: Props) {
  const q = useAdminTracks(filters, autoSync);
  const patch = usePatchTrack();
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const data = q.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const allCount = data?.genres.reduce((s, g) => s + g.count, 0) ?? 0;
  const hasFilters = Boolean(
    filters.q ||
    filters.genre ||
    filters.status !== 'all' ||
    filters.explicit === 'exclude' ||
    filters.range === '1h',
  );

  const actions: RowActions = {
    togglePlayed: (t) => patch.mutate({ trackKey: t.trackKey, patch: { played: !t.played } }),
    askHide: (t) => setConfirmKey(t.trackKey),
    cancelHide: () => setConfirmKey(null),
    confirmHide: (t) => {
      setConfirmKey(null);
      patch.mutate({ trackKey: t.trackKey, patch: { hidden: true } });
    },
    unhide: (t) => patch.mutate({ trackKey: t.trackKey, patch: { hidden: false } }),
  };

  return (
    <Card className="p-0">
      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-[22px] leading-7 font-bold text-fg">{d.ranking}</h2>
            {data ? <Badge variant="red">{d.rankingTotal(data.total)}</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-fg-muted">{d.rankingSubtitle}</p>
        </div>

        <Toolbar filters={filters} update={update} />

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <Chip active={!filters.genre} onClick={() => update({ genre: '' })}>
            <span className="tabular">{d.allGenres(allCount)}</span>
          </Chip>
          {data?.genres.map((g) => (
            <Chip
              key={g.name}
              active={filters.genre === g.name}
              onClick={() => update({ genre: filters.genre === g.name ? '' : g.name })}
            >
              <span className="tabular">{d.genreChip(g.name, g.count)}</span>
            </Chip>
          ))}
        </div>
      </div>

      <div className="border-t border-border" aria-busy={q.isFetching}>
        {q.isPending ? (
          <ul aria-label={fr.admin.loading} className="divide-y divide-border">
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3 sm:px-6">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="size-12" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/5" />
                </div>
              </li>
            ))}
          </ul>
        ) : q.isError && !data ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 p-8 text-center text-sm text-fg-muted"
          >
            <AlertTriangle className="size-6 text-brand-red-text" aria-hidden />
            {d.listError}
            <Button size="sm" onClick={() => void q.refetch()}>
              {d.retry}
            </Button>
          </div>
        ) : data && data.items.length === 0 ? (
          hasFilters ? (
            <div className="flex flex-col items-center gap-3 p-10 text-center text-sm text-fg-muted">
              {d.emptyFiltered}
              <Button size="sm" onClick={reset}>
                {d.resetFilters}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-10 text-center text-sm text-fg-muted">
              {d.emptyAll}
              <Button
                variant="brand"
                size="sm"
                onClick={() =>
                  void navigator.clipboard
                    ?.writeText(window.location.origin)
                    .then(() => toast.success(d.copied))
                    .catch(() => toast(window.location.origin))
                }
              >
                <Link2 className="size-4" aria-hidden /> {d.copyLink}
              </Button>
            </div>
          )
        ) : data ? (
          <>
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="border-b border-border text-left text-[11px] leading-[14px] font-bold tracking-[0.06em] text-fg-muted uppercase">
                  <th scope="col" className="w-20 py-3 pr-3 pl-6">
                    {d.colRank}
                  </th>
                  <th scope="col" className="w-full py-3">
                    {d.colTrack}
                  </th>
                  <th scope="col" className="hidden py-3 pr-4 lg:table-cell">
                    {d.colGenre}
                  </th>
                  <th scope="col" className="py-3 pr-2 text-right">
                    {d.colCount}
                  </th>
                  <th scope="col" className="hidden py-3 pl-6 xl:table-cell">
                    {d.colTimes}
                  </th>
                  <th scope="col" className="py-3 pr-6 text-right">
                    {d.colActions}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((t) => (
                  <TableRow key={t.trackKey} t={t} actions={actions} confirming={confirmKey === t.trackKey} />
                ))}
              </tbody>
            </table>
            <ul className="divide-y divide-border md:hidden">
              {data.items.map((t) => (
                <MobileRow key={t.trackKey} t={t} actions={actions} confirming={confirmKey === t.trackKey} />
              ))}
            </ul>
            <nav
              aria-label="Pagination"
              className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-6"
            >
              <span className="tabular text-sm text-fg-muted">{d.page(filters.page, pages)}</span>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  aria-label={d.prev}
                  disabled={filters.page <= 1}
                  onClick={() => update({ page: filters.page - 1 })}
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </Button>
                <Button
                  size="icon"
                  aria-label={d.next}
                  disabled={!data.hasMore}
                  onClick={() => update({ page: filters.page + 1 })}
                >
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              </div>
            </nav>
          </>
        ) : null}
      </div>
    </Card>
  );
}

function Toolbar({ filters, update }: Pick<Props, 'filters' | 'update'>) {
  const [text, setText] = useState(filters.q);
  const [debounced] = useDebouncedValue(text, 300);
  const updateRef = useRef(update);
  updateRef.current = update;
  useEffect(() => {
    if (debounced !== filters.q) updateRef.current({ q: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);
  useEffect(() => {
    // External reset (e.g. "Réinitialiser les filtres").
    if (filters.q === '') setText('');
  }, [filters.q]);

  const selectCls =
    'h-10 cursor-pointer rounded-md border border-border bg-surface-2 px-3 text-sm text-fg focus:ring-2 focus:ring-brand-blue focus:outline-none';
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-brand-blue-text"
        />
        <input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={d.searchPlaceholder}
          aria-label={d.searchLabel}
          maxLength={80}
          className="h-10 w-full rounded-md border border-border bg-surface-2 pr-3 pl-9 text-sm text-fg placeholder:text-fg-subtle focus:ring-2 focus:ring-brand-blue focus:outline-none"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-fg-muted">
          {d.sortLabel}
          <select
            className={selectCls}
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value as AdminSort })}
          >
            {(Object.keys(d.sorts) as AdminSort[]).map((k) => (
              <option key={k} value={k}>
                {d.sorts[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-fg-muted">
          {d.statusLabel}
          <select
            className={selectCls}
            value={filters.status}
            onChange={(e) => update({ status: e.target.value as AdminStatus })}
          >
            {(Object.keys(d.statuses) as AdminStatus[]).map((k) => (
              <option key={k} value={k}>
                {d.statuses[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex h-10 cursor-pointer items-center gap-2 text-sm text-fg">
          <input
            type="checkbox"
            role="switch"
            checked={filters.explicit === 'exclude'}
            onChange={(e) => update({ explicit: e.target.checked ? 'exclude' : 'include' })}
            className="size-4 cursor-pointer accent-brand-blue"
          />
          {d.hideExplicit}
        </label>
      </div>
    </div>
  );
}

interface RowActions {
  togglePlayed: (t: AdminTrackDto) => void;
  askHide: (t: AdminTrackDto) => void;
  cancelHide: () => void;
  confirmHide: (t: AdminTrackDto) => void;
  unhide: (t: AdminTrackDto) => void;
}

function Rank({ rank }: { rank: number }) {
  return rank <= 3 ? (
    <span role="img" aria-label={fr.track.rankAria(rank)} className="text-xl">
      {MEDALS[rank - 1]}
    </span>
  ) : (
    <span className="tabular font-display font-bold text-fg-muted">#{rank}</span>
  );
}

function TrackInfo({ t }: { t: AdminTrackDto }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <TrackCover src={t.coverSmall} size={48} />
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          <p
            className={cn(
              'truncate font-display font-semibold text-fg',
              t.played && 'line-through decoration-fg-subtle decoration-1',
            )}
          >
            {t.title}
          </p>
          {t.explicit ? <ExplicitBadge label={fr.track.explicit} /> : null}
          {t.hidden ? <Badge>{d.hiddenBadge}</Badge> : null}
        </div>
        <p className="truncate text-sm text-fg-muted">{t.artist}</p>
      </div>
    </div>
  );
}

function Actions({ t, actions, confirming }: { t: AdminTrackDto; actions: RowActions; confirming: boolean }) {
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [menu]);

  if (confirming) {
    return (
      <div
        role="alertdialog"
        aria-label={d.hideConfirm}
        className="flex flex-wrap items-center justify-end gap-2"
      >
        <span className="text-xs text-fg-muted">{d.hideConfirm}</span>
        <Button size="sm" variant="ghost" onClick={actions.cancelHide} autoFocus>
          {d.cancel}
        </Button>
        <Button size="sm" variant="primary" onClick={() => actions.confirmHide(t)}>
          {d.confirmHide}
        </Button>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-end gap-2">
      <PreviewButton
        trackKey={t.trackKey}
        title={t.title}
        available={t.hasPreview}
        source={() => ({ resolve: () => api.preview(t.trackKey, t.deezerId).then((r) => r.previewUrl) })}
      />
      {!t.hidden ? (
        <Button
          size="sm"
          variant={t.played ? 'brand' : 'secondary'}
          aria-pressed={t.played}
          aria-label={t.played ? d.markUnplayed(t.title) : d.markPlayed(t.title)}
          onClick={() => actions.togglePlayed(t)}
        >
          {t.played ? (
            d.played
          ) : (
            <>
              <Check className="size-4" aria-hidden /> Joué
            </>
          )}
        </Button>
      ) : null}
      <div className="relative" ref={menuRef}>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={d.more(t.title)}
          aria-haspopup="menu"
          aria-expanded={menu}
          onClick={() => setMenu((m) => !m)}
        >
          <MoreHorizontal className="size-4" aria-hidden />
        </Button>
        {menu ? (
          <div
            role="menu"
            className="absolute top-full right-0 z-20 mt-1 min-w-52 rounded-md border border-border bg-surface p-1 shadow-float"
          >
            <button
              type="button"
              role="menuitem"
              autoFocus
              onClick={() => {
                setMenu(false);
                if (t.hidden) actions.unhide(t);
                else actions.askHide(t);
              }}
              className="w-full cursor-pointer rounded-sm px-3 py-2 text-left text-sm text-fg hover:bg-surface-2"
            >
              {t.hidden ? d.unhide : d.hide}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TableRow({
  t,
  actions,
  confirming,
}: {
  t: AdminTrackDto;
  actions: RowActions;
  confirming: boolean;
}) {
  return (
    <tr
      className={cn(
        'transition-opacity hover:bg-surface-2/60',
        t.played && 'opacity-60',
        t.hidden && 'opacity-60',
      )}
    >
      <td className="py-3 pr-3 pl-6">
        <Rank rank={t.rank} />
      </td>
      <td className="w-full max-w-0 py-3 pr-4">
        <TrackInfo t={t} />
      </td>
      <td className="hidden py-3 pr-4 lg:table-cell">
        {t.genre ? <Badge variant="blue">{t.genre}</Badge> : <span className="text-fg-subtle">—</span>}
      </td>
      <td className="py-3 text-right">
        <span
          className="tabular font-display text-xl font-bold text-brand-red-text"
          title={fr.track.countTitle(t.addCount)}
        >
          ×{t.addCount}
        </span>
      </td>
      <td className="tabular hidden py-3 pl-6 text-xs whitespace-nowrap text-fg-muted xl:table-cell">
        {d.times(formatTime(t.firstAddedAt), formatTime(t.lastAddedAt))}
      </td>
      <td className="py-3 pr-6 pl-4">
        <Actions t={t} actions={actions} confirming={confirming} />
      </td>
    </tr>
  );
}

function MobileRow({
  t,
  actions,
  confirming,
}: {
  t: AdminTrackDto;
  actions: RowActions;
  confirming: boolean;
}) {
  return (
    <li className={cn('flex flex-col gap-3 px-4 py-3', (t.played || t.hidden) && 'opacity-60')}>
      <div className="flex items-center gap-3">
        <div className="w-9 shrink-0 text-center">
          <Rank rank={t.rank} />
        </div>
        <div className="min-w-0 flex-1">
          <TrackInfo t={t} />
        </div>
        <span className="tabular font-display text-lg font-bold text-brand-red-text">×{t.addCount}</span>
      </div>
      <div className="flex items-center justify-between gap-2 pl-12">
        <div className="min-w-0 text-xs text-fg-muted">
          {t.genre ? (
            <Badge variant="blue" className="mb-1 max-w-full truncate">
              {t.genre}
            </Badge>
          ) : null}
          <p className="tabular truncate">{d.times(formatTime(t.firstAddedAt), formatTime(t.lastAddedAt))}</p>
        </div>
      </div>
      <Actions t={t} actions={actions} confirming={confirming} />
    </li>
  );
}
