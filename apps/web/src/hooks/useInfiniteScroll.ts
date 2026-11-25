import { useEffect, useRef } from 'react';

/** Distance before the end of the list at which the next page starts loading. */
const PRELOAD_MARGIN = '400px';

export const supportsIntersectionObserver = () =>
  typeof window !== 'undefined' && 'IntersectionObserver' in window;

/**
 * Calls `onReach` when the returned sentinel element approaches the viewport.
 * Inactive while `enabled` is false (no next page, a page already loading, or an error).
 */
export function useInfiniteScroll<T extends Element>(enabled: boolean, onReach: () => void) {
  const ref = useRef<T>(null);
  const onReachRef = useRef(onReach);
  onReachRef.current = onReach;

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el || !supportsIntersectionObserver()) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onReachRef.current();
      },
      { rootMargin: `0px 0px ${PRELOAD_MARGIN} 0px` },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled]);

  return ref;
}
