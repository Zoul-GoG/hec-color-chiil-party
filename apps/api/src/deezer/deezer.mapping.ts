import type { DeezerRawTrack, DeezerTrack } from './deezer.types';

/** `isrc:<ISRC>` when known, else `dz:<id>` (docs/05-DEEZER.md §3). */
export function toTrackKey(isrc: string | null | undefined, id: number): string {
  const clean = isrc?.trim();
  return clean ? `isrc:${clean.toUpperCase()}` : `dz:${id}`;
}

/** Reads `hdnea=exp=<unix seconds>` from a Deezer preview URL. */
export function parsePreviewExpiry(url: string | null | undefined): Date | null {
  if (!url) return null;
  const match = /exp=(\d+)/.exec(url);
  return match ? new Date(Number(match[1]) * 1000) : null;
}

/** Search cache key: trim, lowercase, no accents, single spaces. */
export function normalizeQuery(q: string): string {
  return q.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function mapRawTrack(raw: DeezerRawTrack): DeezerTrack | null {
  if (!raw || raw.readable === false || (raw.type !== undefined && raw.type !== 'track')) return null;
  const previewUrl = raw.preview || null;
  return {
    deezerId: raw.id,
    trackKey: toTrackKey(raw.isrc, raw.id),
    isrc: raw.isrc?.trim().toUpperCase() || null,
    title: raw.title,
    artist: raw.artist?.name ?? '',
    album: raw.album?.title ?? '',
    albumId: raw.album?.id ?? 0,
    coverSmall: raw.album?.cover_small ?? '',
    coverMedium: raw.album?.cover_medium ?? '',
    duration: raw.duration ?? 0,
    explicit: raw.explicit_lyrics === true,
    link: raw.link ?? `https://www.deezer.com/track/${raw.id}`,
    rank: raw.rank ?? 0,
    previewUrl,
    previewExpiresAt: parsePreviewExpiry(previewUrl),
  };
}

/**
 * Dedupes by trackKey: the first occurrence keeps its position (Deezer relevance order),
 * but its content is the duplicate with the highest `rank`.
 */
export function dedupeByTrackKey(tracks: DeezerTrack[]): DeezerTrack[] {
  const out: DeezerTrack[] = [];
  const indexByKey = new Map<string, number>();
  for (const t of tracks) {
    const idx = indexByKey.get(t.trackKey);
    if (idx === undefined) {
      indexByKey.set(t.trackKey, out.length);
      out.push(t);
    } else if (t.rank > out[idx].rank) {
      out[idx] = t;
    }
  }
  return out;
}
