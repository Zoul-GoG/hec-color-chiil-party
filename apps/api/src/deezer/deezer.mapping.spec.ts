import { fixture } from '../../test/fake-deezer';
import {
  dedupeByTrackKey,
  mapRawTrack,
  normalizeQuery,
  parsePreviewExpiry,
  toTrackKey,
} from './deezer.mapping';
import type { DeezerRawSearch, DeezerTrack } from './deezer.types';

const search = fixture<DeezerRawSearch>('deezer-search-bahi.json');
const mapped = search.data!.map(mapRawTrack).filter((t): t is DeezerTrack => t !== null);

describe('deezer mapping', () => {
  it('builds trackKey from ISRC, else Deezer id', () => {
    expect(toTrackKey('fr9w11916593', 1)).toBe('isrc:FR9W11916593');
    expect(toTrackKey(null, 42)).toBe('dz:42');
    expect(toTrackKey('', 42)).toBe('dz:42');
  });

  it('parses the preview expiry (hdnea=exp=)', () => {
    expect(parsePreviewExpiry(mapped[0].previewUrl)?.toISOString()).toBe('2026-11-25T13:14:41.000Z');
    expect(parsePreviewExpiry(null)).toBeNull();
    expect(parsePreviewExpiry('https://x/y.mp3')).toBeNull();
  });

  it('maps a raw search item to the internal shape', () => {
    const batiment = mapped.find((t) => t.deezerId === 745229932)!;
    expect(batiment).toMatchObject({
      trackKey: 'isrc:FR9W11916593',
      title: 'Bâtiment',
      artist: 'Niska',
      album: 'Mr Sal',
      duration: 211,
      explicit: true,
      albumId: 109726692,
    });
    expect(batiment.coverSmall).toContain('56x56');
    expect(batiment.coverMedium).toContain('250x250');
  });

  it('ignores unreadable / non-track items', () => {
    const base = search.data![0];
    expect(mapRawTrack({ ...base, readable: false })).toBeNull();
    expect(mapRawTrack({ ...base, type: 'album' })).toBeNull();
    expect(mapRawTrack({ ...base, preview: '' })?.previewUrl).toBeNull();
  });

  it('dedupes the bahi fixture to 22 unique tracks, keeping the highest rank', () => {
    expect(mapped).toHaveLength(25);
    const unique = dedupeByTrackKey(mapped);
    expect(unique).toHaveLength(22);
    expect(new Set(unique.map((t) => t.trackKey)).size).toBe(22);
    expect(unique.find((t) => t.trackKey === 'isrc:FR9W11916593')?.deezerId).toBe(745229932);
  });

  it('normalises queries for the cache', () => {
    expect(normalizeQuery('  Magic   SYSTÈME ')).toBe('magic systeme');
  });
});
