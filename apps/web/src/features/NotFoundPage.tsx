import { Disc3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { fr } from '../i18n/fr';

export function NotFoundPage() {
  useDocumentTitle(fr.titles.notFound);
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        <Disc3 className="size-14 text-brand-blue-text" aria-hidden />
        <h1 className="font-display text-[26px] leading-8 font-bold text-fg sm:text-[32px] sm:leading-10">
          {fr.notFound.title}
        </h1>
        <Link
          to="/"
          className="inline-flex h-10 items-center rounded-md bg-brand-red px-4 text-sm font-semibold text-white hover:bg-brand-red-hover"
        >
          {fr.notFound.back}
        </Link>
      </main>
      <Footer />
    </div>
  );
}
