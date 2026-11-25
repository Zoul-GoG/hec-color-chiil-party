import type { TrackDto } from '@hcc/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Footer } from '../../components/Footer';
import { Halos } from '../../components/Halos';
import { Header } from '../../components/Header';
import { useAddTrack } from '../../hooks/useAddTrack';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fr } from '../../i18n/fr';
import { Hero } from './Hero';
import { PlaylistSection } from './PlaylistSection';
import { SearchSection, type SearchSectionHandle } from './SearchSection';

const HIGHLIGHT_MS = 2000;

export function GuestPage() {
  useDocumentTitle(fr.titles.home);
  const searchRef = useRef<SearchSectionHandle>(null);
  const [highlightKey, setHighlightKey] = useState<string | null>(null);
  const { add, isPending } = useAddTrack(setHighlightKey);

  useEffect(() => {
    if (!highlightKey) return;
    const id = setTimeout(() => setHighlightKey(null), HIGHLIGHT_MS);
    return () => clearTimeout(id);
  }, [highlightKey]);

  const onPlusOne = useCallback((t: TrackDto, origin: HTMLElement) => void add(t.deezerId, origin), [add]);

  const focusSearch = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    searchRef.current?.focus();
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="relative isolate flex-1">
        <Halos />
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <Hero />
          <SearchSection ref={searchRef} onAdd={add} isPending={isPending} />
          <PlaylistSection
            highlightKey={highlightKey}
            onPlusOne={onPlusOne}
            isPending={isPending}
            onFocusSearch={focusSearch}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
