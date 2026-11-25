/**
 * Every setting that is NOT one of the 4 env variables lives here (docs/08-DEPLOYMENT.md §1, ADR D9).
 */
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const PORT = Number(process.env.PORT) || 3000;
export const API_PREFIX = 'api';
export const DEFAULT_DB_NAME = 'hec_color_chill';

export const EVENT = {
  name: 'HEC Color & Chill Party',
  date: '2026-11-27T19:00:00Z',
} as const;

/** Deezer protection (docs/05-DEEZER.md §5). */
export const DEEZER = {
  baseUrl: 'https://api.deezer.com',
  searchLimit: 15,
  resultsShown: 8,
  timeoutMs: 5_000,
  searchCacheMax: 2_000,
  searchCacheTtlMs: 5 * 60_000,
  trackCacheTtlMs: 5 * 60_000,
  albumGenreCacheTtlMs: 24 * 60 * 60_000,
  reservoir: 20,
  reservoirRefreshMs: 5_000,
  maxConcurrent: 5,
  maxQueued: 30,
  lowPriorityMaxQueued: 10,
  circuitBreakerPauseMs: 10_000,
  previewMinValidityMs: 60_000,
} as const;

/** Rate limits (docs/02-ARCHITECTURE.md §6). */
export const THROTTLE = {
  globalPerMinute: 600,
  searchPerMinute: 40,
  additionsPerIp: { limit: 300, ttlMs: 10 * 60_000 },
  loginPerIp: { limit: 5, ttlMs: 15 * 60_000 },
} as const;

export const AUTH = {
  cookieName: 'hcc_admin',
  sessionMs: 12 * 60 * 60_000,
  rememberMs: 7 * 24 * 60 * 60_000,
  bcryptCost: 12,
} as const;
