import { Search, X } from 'lucide-react';
import { forwardRef, useEffect, type KeyboardEvent } from 'react';
import { Spinner } from '../../components/ui/Spinner';
import { txt } from '../../i18n';

export const SUGGESTIONS_ID = 'search-suggestions';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  expanded: boolean;
}

/** 52 px rounded search input (docs/06 §6). ⌘K / Ctrl+K focuses it on desktop. */
export const SearchBox = forwardRef<HTMLInputElement, Props>(function SearchBox(
  { value, onChange, onSubmit, loading, expanded },
  ref,
) {
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (ref && typeof ref !== 'function') ref.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ref]);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
    } else if (e.key === 'Escape' && value) {
      onChange('');
    }
  };

  return (
    <div className="relative">
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-brand-blue-text"
      />
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={txt.search.placeholder}
        aria-label={txt.search.label}
        role="combobox"
        aria-expanded={expanded}
        aria-controls={SUGGESTIONS_ID}
        aria-autocomplete="list"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="search"
        inputMode="search"
        maxLength={80}
        className="h-[52px] w-full rounded-full border border-border bg-surface pr-24 pl-12 text-base text-fg shadow-card placeholder:text-fg-subtle focus:ring-2 focus:ring-brand-blue focus:outline-none"
      />
      <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1.5">
        {loading ? <Spinner className="text-fg-muted" /> : null}
        {value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label={txt.search.clear}
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-fg-muted hover:bg-surface-2"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : (
          <kbd className="hidden rounded-sm border border-border bg-surface-2 px-1.5 py-0.5 font-sans text-[11px] font-semibold text-fg-muted lg:inline-block">
            ⌘K
          </kbd>
        )}
      </div>
    </div>
  );
});
