import type { TrackDto } from '@hcc/shared';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Footer } from '../../components/Footer';
import { Halos } from '../../components/Halos';
import { Lock } from 'lucide-react';
import { useAudioPreview } from '../../audio/AudioPreviewProvider';
import { Header } from '../../components/Header';
import { MiniPlayer } from '../../components/MiniPlayer';
import { useSubmissionsOpen } from '../../hooks/useSettings';
import { useAddTrack } from '../../hooks/useAddTrack';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { txt } from '../../i18n';
import { Hero } from './Hero';
import { PlaylistSection } from './PlaylistSection';
import { SearchSection, type SearchSectionHandle } from './SearchSection';

const HIGHLIGHT_MS = 2000;

export function GuestPage() {
  useDocumentTitle(txt.titles.home);
  const searchRef = useRef<SearchSectionHandle>(null);
  const [highlightKey, setHighlightKey] = useState<string | null>(null);
  const { add, isPending } = useAddTrack(setHighlightKey);
  const open = useSubmissionsOpen();
  const playing = useAudioPreview().state.currentKey !== null;

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
      <main className={`relative isolate flex-1 ${playing ? 'max-sm:pb-20' : ''}`}>
        <Halos />
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <Hero open={open} />
          {open ? (
            <SearchSection ref={searchRef} onAdd={add} isPending={isPending} />
          ) : (
            <p
              role="status"
              className="mx-auto mt-8 flex max-w-2xl items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 py-4 text-center font-display font-semibold text-fg shadow-card"
            >
              <Lock className="size-5 shrink-0 text-brand-red-text" aria-hidden />
              {txt.closed.banner}
            </p>
          )}
          <PlaylistSection
            highlightKey={highlightKey}
            onPlusOne={onPlusOne}
            isPending={isPending}
            onFocusSearch={focusSearch}
            readOnly={!open}
          />
        </div>
      </main>
      <Footer />
      <MiniPlayer />
    </div>
  );
}
