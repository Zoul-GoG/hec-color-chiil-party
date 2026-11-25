/** Front-end constants (no env variables, docs/08-DEPLOYMENT.md §1). */
export const SEARCH_DEBOUNCE_MS = 600;
export const SEARCH_MIN_CHARS = 3;
export const SEARCH_STALE_MS = 5 * 60_000;
export const POLL_INTERVAL_MS = 15_000;
export const PLAYLIST_PAGE_SIZE = 24;
export const ADMIN_PAGE_SIZE = 50;
export const STORAGE_KEYS = {
  theme: 'hcc-theme',
  lang: 'hcc-lang',
  guestId: 'hcc-guest-id',
} as const;
