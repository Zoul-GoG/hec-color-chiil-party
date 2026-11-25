import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ErrorCode } from '@hcc/shared';
import Bottleneck from 'bottleneck';
import { LRUCache } from 'lru-cache';
import { AppException } from '../common/app.exception';
import { DEEZER } from '../config/constants';
import { dedupeByTrackKey, mapRawTrack, normalizeQuery } from './deezer.mapping';
import {
  DEEZER_FETCH,
  type DeezerRawAlbum,
  type DeezerRawError,
  type DeezerRawSearch,
  type DeezerRawTrack,
  type DeezerTrack,
  type FetchFn,
} from './deezer.types';

const HIGH = 1;
const LOW = 9;
const NO_GENRE = '';

class DeezerNotFound extends Error {}

/**
 * The only gateway to api.deezer.com (docs/05-DEEZER.md §5): LRU caches, in-flight dedupe,
 * global bottleneck limiter with bounded queue, quota circuit breaker, 5 s timeout.
 */
@Injectable()
export class DeezerService implements OnModuleDestroy {
  private readonly logger = new Logger(DeezerService.name);
  private readonly searchCache = new LRUCache<string, DeezerTrack[]>({
    max: DEEZER.searchCacheMax,
    ttl: DEEZER.searchCacheTtlMs,
  });
  private readonly trackCache = new LRUCache<number, DeezerTrack>({
    max: 5_000,
    ttl: DEEZER.trackCacheTtlMs,
  });
  private readonly genreCache = new LRUCache<number, string>({
    max: 5_000,
    ttl: DEEZER.albumGenreCacheTtlMs,
  });
  private readonly inFlight = new Map<string, Promise<unknown>>();
  private readonly limiter = new Bottleneck({
    reservoir: DEEZER.reservoir,
    reservoirRefreshAmount: DEEZER.reservoir,
    reservoirRefreshInterval: DEEZER.reservoirRefreshMs,
    maxConcurrent: DEEZER.maxConcurrent,
    highWater: DEEZER.maxQueued,
    strategy: Bottleneck.strategy.OVERFLOW,
  });
  private pausedUntil = 0;

  constructor(@Inject(DEEZER_FETCH) private readonly fetchFn: FetchFn) {}

  onModuleDestroy(): void {
    void this.limiter.stop({ dropWaitingJobs: true }).catch(() => undefined);
  }

  /** True while the quota circuit breaker is open. */
  isPaused(now = Date.now()): boolean {
    return now < this.pausedUntil;
  }

  /** Deduped search results (≤ 15, Deezer order). Callers filter/slice. */
  async search(q: string): Promise<DeezerTrack[]> {
    const key = normalizeQuery(q);
    const cached = this.searchCache.get(key);
    if (cached) return cached;
    return this.once(`search:${key}`, async () => {
      const body = await this.call<DeezerRawSearch>(
        `/search?q=${encodeURIComponent(key)}&limit=${DEEZER.searchLimit}`,
        HIGH,
      );
      const tracks = dedupeByTrackKey(
        (body.data ?? []).map(mapRawTrack).filter((t): t is DeezerTrack => t !== null),
      );
      this.searchCache.set(key, tracks);
      for (const t of tracks) this.trackCache.set(t.deezerId, t);
      return tracks;
    });
  }

  /** Track details; `fresh` bypasses the cache (expired preview). 404 → TRACK_NOT_FOUND. */
  async getTrack(id: number, opts: { fresh?: boolean } = {}): Promise<DeezerTrack> {
    if (!opts.fresh) {
      const cached = this.trackCache.get(id);
      if (cached) return cached;
    }
    return this.once(`track:${id}:${opts.fresh ? 'fresh' : 'cached'}`, async () => {
      try {
        const raw = await this.call<DeezerRawTrack>(`/track/${id}`, HIGH);
        const track = mapRawTrack(raw);
        if (!track) throw new AppException(ErrorCode.TRACK_NOT_FOUND);
        this.trackCache.set(id, track);
        return track;
      } catch (e) {
        if (e instanceof DeezerNotFound) throw new AppException(ErrorCode.TRACK_NOT_FOUND);
        throw e;
      }
    });
  }

  /** Album genre, low priority: never throws, abandoned when the queue is busy. */
  async getAlbumGenre(albumId: number): Promise<string | null> {
    if (!albumId) return null;
    const cached = this.genreCache.get(albumId);
    if (cached !== undefined) return cached || null;
    if (this.limiter.counts().QUEUED > DEEZER.lowPriorityMaxQueued) return null;
    try {
      const album = await this.call<DeezerRawAlbum>(`/album/${albumId}`, LOW);
      const genre = album.genres?.data?.[0]?.name?.trim() || null;
      this.genreCache.set(albumId, genre ?? NO_GENRE);
      return genre;
    } catch (e) {
      if (e instanceof DeezerNotFound) this.genreCache.set(albumId, NO_GENRE);
      return null;
    }
  }

  /** Coalesces identical concurrent calls into one promise. */
  private once<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) return existing as Promise<T>;
    const p = fn().finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, p);
    return p;
  }

  private unavailable(): AppException {
    return new AppException(ErrorCode.DEEZER_UNAVAILABLE);
  }

  private async call<T>(path: string, priority: number): Promise<T> {
    if (this.isPaused()) throw this.unavailable();
    let body: unknown;
    try {
      body = await this.limiter.schedule({ priority }, () => this.fetchJson(path));
    } catch (e) {
      if (e instanceof Bottleneck.BottleneckError) {
        this.logger.warn(`File Deezer pleine, requête refusée : ${path.split('?')[0]}`);
      } else {
        this.logger.error(`Appel Deezer en échec ${path.split('?')[0]} : ${(e as Error).message}`);
      }
      throw this.unavailable();
    }
    const error = (body as DeezerRawError | null)?.error;
    if (error) {
      if (error.code === 4) {
        this.pausedUntil = Date.now() + DEEZER.circuitBreakerPauseMs;
        this.logger.warn(`Quota Deezer atteint (code 4) : pause de ${DEEZER.circuitBreakerPauseMs / 1000} s`);
        throw this.unavailable();
      }
      if (error.code === 800) throw new DeezerNotFound(error.message);
      this.logger.error(
        `Erreur Deezer ${error.code ?? '?'} sur ${path.split('?')[0]} : ${error.message ?? ''}`,
      );
      throw this.unavailable();
    }
    return body as T;
  }

  private async fetchJson(path: string): Promise<unknown> {
    this.logger.debug(`GET deezer ${path}`);
    const res = await this.fetchFn(`${DEEZER.baseUrl}${path}`, {
      signal: AbortSignal.timeout(DEEZER.timeoutMs),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
}
