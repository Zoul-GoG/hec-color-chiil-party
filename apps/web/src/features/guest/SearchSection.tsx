import type { SearchResultDto } from '@hcc/shared';
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Chip } from '../../components/ui/Chip';
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_CHARS } from '../../config';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useSearch } from '../../hooks/useSearch';
import { fr } from '../../i18n/fr';
import { SearchBox } from './SearchBox';
import { SuggestionList } from './SuggestionList';

interface Props {
  onAdd: (deezerId: number, origin: HTMLElement) => Promise<boolean>;
  isPending: (deezerId: number) => boolean;
}

export interface SearchSectionHandle {
  focus: () => void;
}

/** US-1: debounced (1 s, ≥ 3 chars) Deezer search with in-flow suggestions. */
export const SearchSection = forwardRef<SearchSectionHandle, Props>(function SearchSection(
  { onAdd, isPending },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [debounced, flush] = useDebouncedValue(value, SEARCH_DEBOUNCE_MS);
  // Never search a stale term once the input was cleared / shortened.
  const term = value.trim().length >= SEARCH_MIN_CHARS ? debounced : '';
  const search = useSearch(term);
  const active = term.trim().length >= SEARCH_MIN_CHARS;

  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }), []);

  const handleAdd = async (item: SearchResultDto, origin: HTMLElement) => {
    if (await onAdd(item.deezerId, origin)) {
      setValue('');
      inputRef.current?.focus();
    }
  };

  const pickIdea = (idea: string) => {
    setValue(idea);
    flush(idea);
  };

  return (
    <section className="mx-auto mt-8 w-full max-w-2xl">
      <SearchBox
        ref={inputRef}
        value={value}
        onChange={setValue}
        onSubmit={() => flush()}
        loading={search.isFetching}
        expanded={active}
      />
      {!value ? (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm text-fg-muted">{fr.search.ideas}</span>
          {fr.search.ideaChips.map((idea, i) => (
            <Chip key={idea} dot={i} onClick={() => pickIdea(idea)}>
              {idea}
            </Chip>
          ))}
        </div>
      ) : null}
      {active ? (
        <SuggestionList
          query={term.trim()}
          items={search.data?.items}
          isLoading={search.isPending}
          error={search.error}
          onRetry={() => void search.refetch()}
          onAdd={handleAdd}
          isPending={isPending}
        />
      ) : null}
    </section>
  );
});
