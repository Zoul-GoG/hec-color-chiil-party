import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  ErrorCode,
  type Paginated,
  type PreviewDto,
  type PublicSort,
  type SearchResultDto,
  type TrackDto,
} from '@hcc/shared';
import type { Model, SortOrder } from 'mongoose';
import { Addition } from '../additions/addition.schema';
import { AppException } from '../common/app.exception';
import { DEEZER } from '../config/constants';
import { DeezerService } from '../deezer/deezer.service';
import { toTrackDto } from './track.mapper';
import { Track } from './track.schema';

const SORTS: Record<PublicSort, Record<string, SortOrder>> = {
  popular: { addCount: -1, lastAddedAt: -1, _id: 1 },
  recent: { firstAddedAt: -1, _id: 1 },
};

@Injectable()
export class TracksService {
  constructor(
    @InjectModel(Track.name) private readonly tracks: Model<Track>,
    @InjectModel(Addition.name) private readonly additions: Model<Addition>,
    private readonly deezer: DeezerService,
  ) {}

  /** Keys of the given tracks this guest already added. */
  async addedByGuest(guestId: string | null, trackKeys: string[]): Promise<Set<string>> {
    if (!guestId || trackKeys.length === 0) return new Set();
    const rows = await this.additions
      .find({ guestId, trackKey: { $in: trackKeys } }, { trackKey: 1, _id: 0 })
      .lean();
    return new Set(rows.map((r) => r.trackKey));
  }

  /** Deezer search enriched with playlist counts; hidden tracks excluded (docs/02 §3.1). */
  async search(q: string, limit: number, guestId: string | null): Promise<SearchResultDto[]> {
    const results = await this.deezer.search(q);
    const keys = results.map((r) => r.trackKey);
    const [known, mine] = await Promise.all([
      this.tracks.find({ trackKey: { $in: keys } }, { trackKey: 1, addCount: 1, hidden: 1 }).lean(),
      this.addedByGuest(guestId, keys),
    ]);
    const byKey = new Map(known.map((t) => [t.trackKey, t]));
    return results
      .filter((r) => !byKey.get(r.trackKey)?.hidden)
      .slice(0, limit)
      .map((r) => ({
        deezerId: r.deezerId,
        trackKey: r.trackKey,
        title: r.title,
        artist: r.artist,
        album: r.album,
        coverSmall: r.coverSmall,
        coverMedium: r.coverMedium,
        duration: r.duration,
        previewUrl: r.previewUrl,
        explicit: r.explicit,
        addCount: byKey.get(r.trackKey)?.addCount ?? 0,
        addedByMe: mine.has(r.trackKey),
      }));
  }

  async list(
    sort: PublicSort,
    page: number,
    limit: number,
    guestId: string | null,
  ): Promise<Paginated<TrackDto>> {
    const filter = { hidden: false };
    const [docs, total] = await Promise.all([
      this.tracks
        .find(filter)
        .sort(SORTS[sort])
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.tracks.countDocuments(filter),
    ]);
    const mine = await this.addedByGuest(
      guestId,
      docs.map((d) => d.trackKey),
    );
    return {
      items: docs.map((d) => toTrackDto(d, mine.has(d.trackKey))),
      total,
      page,
      limit,
      hasMore: page * limit < total,
    };
  }

  /** Fresh preview URL (Deezer previews expire after ≈ 15 min, docs/05 §7). */
  async preview(trackKey: string, deezerId?: number): Promise<PreviewDto> {
    const track = await this.tracks.findOne({ trackKey }).lean();
    if (track) {
      const validUntil = Date.now() + DEEZER.previewMinValidityMs;
      if (track.previewUrl && track.previewExpiresAt && track.previewExpiresAt.getTime() > validUntil) {
        return { previewUrl: track.previewUrl };
      }
      const fresh = await this.deezer.getTrack(track.deezerId, { fresh: true });
      await this.tracks.updateOne(
        { trackKey },
        { $set: { previewUrl: fresh.previewUrl, previewExpiresAt: fresh.previewExpiresAt } },
      );
      return { previewUrl: fresh.previewUrl };
    }
    if (!deezerId) throw new AppException(ErrorCode.TRACK_NOT_FOUND);
    const fresh = await this.deezer.getTrack(deezerId, { fresh: true });
    if (fresh.trackKey !== trackKey) throw new AppException(ErrorCode.TRACK_NOT_FOUND);
    return { previewUrl: fresh.previewUrl };
  }
}
