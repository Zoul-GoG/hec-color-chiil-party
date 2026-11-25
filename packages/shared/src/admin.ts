import type { Paginated, TrackDto } from './track';

/** Admin types (docs/03-API.md §2 & §4). */
export interface AdminTrackDto extends TrackDto {
  rank: number;
  played: boolean;
  playedAt: string | null;
  hidden: boolean;
}

export type Range = 'all' | '1h';
export type AdminSort = 'count_desc' | 'count_asc' | 'recent' | 'alpha';

export interface AdminTracksQuery {
  q?: string;
  genre?: string;
  range?: Range;
  sort?: AdminSort;
  page?: number;
  limit?: number;
}

export interface GenreCount {
  name: string;
  count: number;
}

export interface AdminTracksResponseDto extends Paginated<AdminTrackDto> {
  genres: GenreCount[];
}

export interface AdminTrackPatchDto {
  played?: boolean;
  hidden?: boolean;
}

export interface StatsDto {
  range: Range;
  uniqueTracks: number;
  totalAdditions: number;
  uniqueGuests: number;
  additionsLastHour: number;
  additionsPrevHour: number;
  topArtist: { name: string; count: number } | null;
  /** Top 4 + "Autres", share ∈ [0,1]. */
  genres: { name: string; count: number; share: number }[];
  /** 15-min buckets. */
  timeline: { bucketStart: string; count: number }[];
  generatedAt: string;
}

export interface AdminLoginDto {
  email: string;
  password: string;
  remember: boolean;
}

export interface AdminMeDto {
  email: string;
}
