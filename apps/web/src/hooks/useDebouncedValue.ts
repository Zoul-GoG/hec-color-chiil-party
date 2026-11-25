import { useCallback, useEffect, useState } from 'react';

/** Debounced copy of `value`; `flush(v?)` commits immediately (Enter key, idea chips). */
export function useDebouncedValue<T>(value: T, delayMs: number): [T, (next?: T) => void] {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  const flush = useCallback((next?: T) => setDebounced(next === undefined ? value : next), [value]);
  return [debounced, flush];
}
