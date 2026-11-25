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
  id: string;
  email: string;
  /** The account whose email is ADMIN_EMAIL (server config). */
  isSuperAdmin: boolean;
}

/** Minimum length of an admin password (API validation + form hint). */
export const ADMIN_PASSWORD_MIN = 8;

/** User management (GET/POST/PATCH/DELETE /api/admin/users). Every account is a full admin. */
export interface AdminUserDto {
  id: string;
  email: string;
  isSuperAdmin: boolean;
  isMe: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface CreateAdminUserDto {
  email: string;
  password: string;
}

export interface UpdateAdminUserDto {
  email?: string;
  password?: string;
}
