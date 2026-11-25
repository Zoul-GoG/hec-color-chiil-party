import type { TrackDto } from '@hcc/shared';
import type { Track } from './track.schema';

export function toTrackDto(t: Track, addedByMe: boolean): TrackDto {
  return {
    trackKey: t.trackKey,
    deezerId: t.deezerId,
    title: t.title,
    artist: t.artistName,
    album: t.albumTitle,
    coverSmall: t.coverSmall,
    coverMedium: t.coverMedium,
    duration: t.duration,
    explicit: t.explicit,
    hasPreview: Boolean(t.previewUrl),
    genre: t.genre ?? null,
    addCount: t.addCount,
    addedByMe,
    firstAddedAt: new Date(t.firstAddedAt).toISOString(),
    lastAddedAt: new Date(t.lastAddedAt).toISOString(),
  };
}
