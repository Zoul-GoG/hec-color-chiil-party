/** Public track types (docs/03-API.md §2). */
export interface SearchResultDto {
  deezerId: number;
  /** "isrc:FR9W11916593" or "dz:745229932" — track identity. */
  trackKey: string;
  title: string;
  artist: string;
  album: string;
  coverSmall: string;
  coverMedium: string;
  /** Seconds. */
  duration: number;
  previewUrl: string | null;
  explicit: boolean;
  addCount: number;
  addedByMe: boolean;
}

export interface SearchResponseDto {
  items: SearchResultDto[];
}

export interface TrackDto {
  trackKey: string;
  deezerId: number;
  title: string;
  artist: string;
  album: string;
  coverSmall: string;
  coverMedium: string;
  duration: number;
  explicit: boolean;
  hasPreview: boolean;
  genre: string | null;
  addCount: number;
  /** Always false on admin routes. */
  addedByMe: boolean;
  firstAddedAt: string;
  lastAddedAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export type PublicSort = 'popular' | 'recent';

export interface AddTrackRequestDto {
  deezerId: number;
}

export interface AddTrackResponseDto {
  /** The track did not exist in the playlist before. */
  created: boolean;
  alreadyAddedByMe: boolean;
  /** addCount - 1 */
  othersCount: number;
  track: TrackDto;
}

export interface PreviewDto {
  previewUrl: string | null;
}

export interface PublicSettingsDto {
  submissionsOpen: boolean;
  eventName: string;
  eventDate: string;
}
