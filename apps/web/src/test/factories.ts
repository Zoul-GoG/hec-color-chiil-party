import type { AddTrackResponseDto, Paginated, SearchResultDto, TrackDto } from '@hcc/shared';

export const result = (over: Partial<SearchResultDto> = {}): SearchResultDto => ({
  deezerId: 745229932,
  trackKey: 'isrc:FR9W11916593',
  title: 'Bâtiment',
  artist: 'Niska',
  album: 'Mr Sal',
  coverSmall: '',
  coverMedium: '',
  duration: 211,
  previewUrl: 'https://cdnt-preview.dzcdn.net/x.mp3?hdnea=exp=1',
  explicit: true,
  addCount: 0,
  addedByMe: false,
  ...over,
});

export const track = (over: Partial<TrackDto> = {}): TrackDto => ({
  trackKey: 'isrc:FR9W11916593',
  deezerId: 745229932,
  title: 'Bâtiment',
  artist: 'Niska',
  album: 'Mr Sal',
  coverSmall: '',
  coverMedium: '',
  duration: 211,
  explicit: true,
  hasPreview: true,
  genre: 'Rap/Hip Hop',
  addCount: 1,
  addedByMe: false,
  firstAddedAt: '2026-11-27T20:00:00.000Z',
  lastAddedAt: '2026-11-27T20:00:00.000Z',
  ...over,
});

export const page = (items: TrackDto[]): Paginated<TrackDto> => ({
  items,
  total: items.length,
  page: 1,
  limit: 24,
  hasMore: false,
});

export const added = (over: Partial<AddTrackResponseDto> = {}): AddTrackResponseDto => ({
  created: true,
  alreadyAddedByMe: false,
  othersCount: 0,
  track: track({ addedByMe: true }),
  ...over,
});
