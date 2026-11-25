/** Raw Deezer payloads (subset we use), see docs/05-DEEZER.md §2. */
export interface DeezerRawTrack {
  id: number;
  readable?: boolean;
  title: string;
  isrc?: string | null;
  link?: string;
  duration: number;
  rank?: number;
  explicit_lyrics?: boolean;
  preview?: string | null;
  artist: { id: number; name: string };
  album: { id: number; title: string; cover_small?: string; cover_medium?: string };
  type?: string;
}

export interface DeezerRawError {
  error: { type?: string; message?: string; code?: number };
}

export interface DeezerRawSearch {
  data?: DeezerRawTrack[];
  total?: number;
}

export interface DeezerRawAlbum {
  id: number;
  genres?: { data?: { id: number; name: string }[] };
}

/** Normalised internal track. */
export interface DeezerTrack {
  deezerId: number;
  trackKey: string;
  isrc: string | null;
  title: string;
  artist: string;
  album: string;
  albumId: number;
  coverSmall: string;
  coverMedium: string;
  duration: number;
  explicit: boolean;
  link: string;
  rank: number;
  previewUrl: string | null;
  previewExpiresAt: Date | null;
}

export type FetchFn = (input: string, init?: { signal?: AbortSignal }) => Promise<Response>;

export const DEEZER_FETCH = Symbol('DEEZER_FETCH');
