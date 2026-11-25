import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fr } from '../../i18n/fr';
import { AdminHeader } from './AdminHeader';

export function DashboardPage() {
  useDocumentTitle(fr.titles.dashboard);
  return (
    <div className="flex min-h-dvh flex-col">
      <AdminHeader />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="font-display text-[26px] leading-8 font-bold sm:text-[32px] sm:leading-10">
          Tableau de bord
        </h1>
      </main>
    </div>
  );
}
