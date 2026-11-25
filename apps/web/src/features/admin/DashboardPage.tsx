import { useDashboardFilters, useStats } from '../../hooks/useDashboard';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fr } from '../../i18n/fr';
import { AdditionsChart } from './AdditionsChart';
import { AdminHeader } from './AdminHeader';
import { DashboardBanner } from './DashboardBanner';
import { GenreCard, KpiCards, TopArtistCard } from './KpiCards';
import { TracksPanel } from './TracksPanel';

/** /admin (docs/07 §3): banner, KPIs, chart, ranking. */
export function DashboardPage() {
  useDocumentTitle(fr.titles.dashboard);
  const { filters, update, reset } = useDashboardFilters();
  const stats = useStats(filters.range);

  return (
    <div className="flex min-h-dvh flex-col">
      <AdminHeader />
      <main className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-4 px-4 py-6 sm:gap-6 sm:px-6 lg:px-8">
        <DashboardBanner
          range={filters.range}
          onRange={(range) => update({ range })}
          generatedAt={stats.data?.generatedAt}
        />
        <KpiCards stats={stats.data} loading={stats.isPending} error={stats.isError && !stats.data} />
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          <TopArtistCard stats={stats.data} loading={stats.isPending} />
          <GenreCard stats={stats.data} loading={stats.isPending} />
        </div>
        <AdditionsChart stats={stats.data} loading={stats.isPending} />
        <TracksPanel filters={filters} update={update} reset={reset} />
      </main>
    </div>
  );
}
