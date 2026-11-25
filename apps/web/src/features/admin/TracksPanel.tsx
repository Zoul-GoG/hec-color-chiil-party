import type { AdminSort, AdminTrackDto } from '@hcc/shared';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Link2,
  MoreHorizontal,
  Search,
} from 'lucide-react';
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
import { toQuery, useAdminTracks, usePatchTrack, type DashboardFilters } from '../../hooks/useDashboard';
import { genreLabel, txt } from '../../i18n';
import { api } from '../../lib/api';
import { formatTime } from '../../lib/format';

interface Props {
  filters: DashboardFilters;
  update: (patch: Partial<DashboardFilters>) => void;
  reset: () => void;
}

/** US-8: filterable ranking (docs/07 §3.4). */
export function TracksPanel({ filters, update, reset }: Props) {
  const q = useAdminTracks(filters);
  const patch = usePatchTrack();
  const [confirmKey, setConfirmKey] = useState<string | null>(null);
  const data = q.data;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const allCount = data?.genres.reduce((s, g) => s + g.count, 0) ?? 0;
  const hasFilters = Boolean(filters.q || filters.genre || filters.range === '1h');

  const actions: RowActions = {
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
            <h2 className="font-display text-[22px] leading-7 font-bold text-fg">{txt.dashboard.ranking}</h2>
            {data ? <Badge variant="red">{txt.dashboard.rankingTotal(data.total)}</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-fg-muted">{txt.dashboard.rankingSubtitle}</p>
        </div>

        <Toolbar filters={filters} update={update} />

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          <Chip active={!filters.genre} onClick={() => update({ genre: '' })}>
            <span className="tabular">{txt.dashboard.allGenres(allCount)}</span>
          </Chip>
          {data?.genres.map((g) => (
            <Chip
              key={g.name}
              active={filters.genre === g.name}
              onClick={() => update({ genre: filters.genre === g.name ? '' : g.name })}
            >
              <span className="tabular">{txt.dashboard.genreChip(genreLabel(g.name), g.count)}</span>
            </Chip>
          ))}
        </div>
      </div>

      <div className="border-t border-border" aria-busy={q.isFetching}>
        {q.isPending ? (
          <ul aria-label={txt.admin.loading} className="divide-y divide-border">
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
            {txt.dashboard.listError}
            <Button size="sm" onClick={() => void q.refetch()}>
              {txt.dashboard.retry}
            </Button>
          </div>
        ) : data && data.items.length === 0 ? (
          hasFilters ? (
            <div className="flex flex-col items-center gap-3 p-10 text-center text-sm text-fg-muted">
              {txt.dashboard.emptyFiltered}
              <Button size="sm" onClick={reset}>
                {txt.dashboard.resetFilters}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 p-10 text-center text-sm text-fg-muted">
              {txt.dashboard.emptyAll}
              <Button
                variant="brand"
                size="sm"
                onClick={() =>
                  void navigator.clipboard
                    ?.writeText(window.location.origin)
                    .then(() => toast.success(txt.dashboard.copied))
                    .catch(() => toast(window.location.origin))
                }
              >
                <Link2 className="size-4" aria-hidden /> {txt.dashboard.copyLink}
              </Button>
            </div>
          )
        ) : data ? (
          <>
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="border-b border-border text-left text-[11px] leading-[14px] font-bold tracking-[0.06em] text-fg-muted uppercase">
                  <th scope="col" className="w-20 py-3 pr-3 pl-6">
                    {txt.dashboard.colRank}
                  </th>
                  <th scope="col" className="w-full py-3">
                    {txt.dashboard.colTrack}
                  </th>
                  <th scope="col" className="hidden py-3 pr-4 lg:table-cell">
                    {txt.dashboard.colGenre}
                  </th>
                  <th scope="col" className="py-3 pr-2 text-right">
                    {txt.dashboard.colCount}
                  </th>
                  <th scope="col" className="hidden py-3 pl-6 xl:table-cell">
                    {txt.dashboard.colTimes}
                  </th>
                  <th scope="col" className="py-3 pr-6 text-right">
                    {txt.dashboard.colActions}
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
              <span className="tabular text-sm text-fg-muted">{txt.dashboard.page(filters.page, pages)}</span>
              <div className="flex gap-2">
                <Button
                  size="icon"
                  aria-label={txt.dashboard.prev}
                  disabled={filters.page <= 1}
                  onClick={() => update({ page: filters.page - 1 })}
                >
                  <ChevronLeft className="size-4" aria-hidden />
                </Button>
                <Button
                  size="icon"
                  aria-label={txt.dashboard.next}
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
          placeholder={txt.dashboard.searchPlaceholder}
          aria-label={txt.dashboard.searchLabel}
          maxLength={80}
          className="h-10 w-full rounded-md border border-border bg-surface-2 pr-3 pl-9 text-sm text-fg placeholder:text-fg-subtle focus:ring-2 focus:ring-brand-blue focus:outline-none"
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-fg-muted">
          {txt.dashboard.sortLabel}
          <select
            className={selectCls}
            value={filters.sort}
            onChange={(e) => update({ sort: e.target.value as AdminSort })}
          >
            {(Object.keys(txt.dashboard.sorts) as AdminSort[]).map((k) => (
              <option key={k} value={k}>
                {txt.dashboard.sorts[k]}
              </option>
            ))}
          </select>
        </label>
        <a
          href={exportUrl(filters)}
          download
          className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-surface-2 px-3 text-sm font-semibold text-fg hover:bg-surface-3"
        >
          <Download className="size-4" aria-hidden /> {txt.dashboard.exportExcel}
        </a>
      </div>
    </div>
  );
}

function exportUrl(f: DashboardFilters): string {
  const { page: _page, limit: _limit, ...q } = toQuery(f);
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== '') params.set(k, String(v));
  return `/api/admin/tracks/export.xlsx?${params.toString()}`;
}

interface RowActions {
  askHide: (t: AdminTrackDto) => void;
  cancelHide: () => void;
  confirmHide: (t: AdminTrackDto) => void;
  unhide: (t: AdminTrackDto) => void;
}

function Rank({ rank, hidden }: { rank: number; hidden: boolean }) {
  if (hidden) return <span className="font-display font-bold text-fg-subtle">—</span>;
  return rank <= 3 ? (
    <span role="img" aria-label={txt.track.rankAria(rank)} className="text-xl">
      {txt.track.medal[rank - 1]}
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
          <p className="truncate font-display font-semibold text-fg">{t.title}</p>
          {t.explicit ? <ExplicitBadge label={txt.track.explicit} /> : null}
          {t.hidden ? <Badge>{txt.dashboard.hiddenBadge}</Badge> : null}
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
        aria-label={txt.dashboard.hideConfirm}
        className="flex flex-wrap items-center justify-end gap-2"
      >
        <span className="text-xs text-fg-muted">{txt.dashboard.hideConfirm}</span>
        <Button size="sm" variant="ghost" onClick={actions.cancelHide} autoFocus>
          {txt.dashboard.cancel}
        </Button>
        <Button size="sm" variant="primary" onClick={() => actions.confirmHide(t)}>
          {txt.dashboard.confirmHide}
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
        source={() => ({
          resolve: () => api.preview(t.trackKey, t.deezerId).then((r) => r.previewUrl),
          meta: { title: t.title, artist: t.artist, cover: t.coverSmall },
        })}
      />
      <div className="relative" ref={menuRef}>
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={txt.dashboard.more(t.title)}
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
              {t.hidden ? txt.dashboard.unhide : txt.dashboard.hide}
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
    <tr className={cn('transition-opacity hover:bg-surface-2/60', t.hidden && 'opacity-60')}>
      <td className="py-3 pr-3 pl-6">
        <Rank rank={t.rank} hidden={t.hidden} />
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
          title={txt.track.countTitle(t.addCount)}
        >
          ×{t.addCount}
        </span>
      </td>
      <td className="tabular hidden py-3 pl-6 text-xs whitespace-nowrap text-fg-muted xl:table-cell">
        {txt.dashboard.times(formatTime(t.firstAddedAt), formatTime(t.lastAddedAt))}
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
    <li className={cn('flex flex-col gap-3 px-4 py-3', t.hidden && 'opacity-60')}>
      <div className="flex items-center gap-3">
        <div className="w-9 shrink-0 text-center">
          <Rank rank={t.rank} hidden={t.hidden} />
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
          <p className="tabular truncate">
            {txt.dashboard.times(formatTime(t.firstAddedAt), formatTime(t.lastAddedAt))}
          </p>
        </div>
      </div>
      <Actions t={t} actions={actions} confirming={confirming} />
    </li>
  );
}
