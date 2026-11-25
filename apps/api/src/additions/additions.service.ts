import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { ErrorCode, type AddTrackResponseDto } from '@hcc/shared';
import type { Model } from 'mongoose';
import { AppException } from '../common/app.exception';
import { hashIp, isDuplicateKeyError } from '../common/utils';
import type { Env } from '../config/env';
import { DeezerService } from '../deezer/deezer.service';
import { SettingsService } from '../settings/settings.service';
import type { DeezerTrack } from '../deezer/deezer.types';
import { toTrackDto } from '../tracks/track.mapper';
import { Track } from '../tracks/track.schema';
import { Addition } from './addition.schema';

export interface AddResult extends AddTrackResponseDto {
  status: 200 | 201;
}

@Injectable()
export class AdditionsService {
  private readonly logger = new Logger(AdditionsService.name);
  private readonly secret: string;

  constructor(
    @InjectModel(Track.name) private readonly tracks: Model<Track>,
    @InjectModel(Addition.name) private readonly additions: Model<Addition>,
    private readonly deezer: DeezerService,
    private readonly settings: SettingsService,
    config: ConfigService<Env, true>,
  ) {
    this.secret = config.get('JWT_SECRET', { infer: true });
  }

  /** Atomic add without transaction (docs/02-ARCHITECTURE.md §3.2). */
  async add(deezerId: number, guestId: string, ip: string | undefined): Promise<AddResult> {
    await this.settings.assertOpen();
    // Cheap pre-check on a known Deezer id, before calling Deezer.
    if (await this.tracks.exists({ deezerIds: deezerId, hidden: true })) {
      throw new AppException(ErrorCode.TRACK_HIDDEN);
    }
    // Never trust client metadata: refetch from Deezer.
    const dz = await this.deezer.getTrack(deezerId);
    const existing = await this.tracks.findOne({ trackKey: dz.trackKey }, { hidden: 1 }).lean();
    if (existing?.hidden) throw new AppException(ErrorCode.TRACK_HIDDEN);

    try {
      await this.additions.create({
        trackKey: dz.trackKey,
        deezerId,
        guestId,
        ipHash: hashIp(ip, this.secret),
      });
    } catch (e) {
      if (!isDuplicateKeyError(e)) throw e;
      const track = await this.tracks.findOne({ trackKey: dz.trackKey }).lean();
      if (track) {
        return {
          status: 200,
          created: false,
          alreadyAddedByMe: true,
          othersCount: Math.max(0, track.addCount - 1),
          track: toTrackDto(track, true),
        };
      }
      // Addition exists without its track (should not happen): repair by counting it now.
      return this.upsertAndRespond(dz, deezerId, () => Promise.resolve());
    }

    return this.upsertAndRespond(dz, deezerId, async () => {
      await this.additions.deleteOne({ trackKey: dz.trackKey, guestId });
    });
  }

  private async upsertAndRespond(
    dz: DeezerTrack,
    deezerId: number,
    compensate: () => Promise<void>,
  ): Promise<AddResult> {
    let track: Track | null;
    try {
      track = await this.upsertTrack(dz, deezerId);
    } catch (e) {
      this.logger.error(`Échec de l'incrément pour ${dz.trackKey}, annulation de l'ajout`);
      await compensate().catch(() => undefined);
      throw e;
    }
    if (!track) throw new AppException(ErrorCode.INTERNAL_ERROR);
    const created = track.addCount === 1;
    if (created && !track.genre) void this.fillGenre(dz);
    return {
      status: 201,
      created,
      alreadyAddedByMe: false,
      othersCount: Math.max(0, track.addCount - 1),
      track: toTrackDto(track, true),
    };
  }

  private async upsertTrack(dz: DeezerTrack, deezerId: number): Promise<Track | null> {
    const now = new Date();
    const run = () =>
      this.tracks
        .findOneAndUpdate(
          { trackKey: dz.trackKey },
          {
            $inc: { addCount: 1 },
            $set: { lastAddedAt: now, previewUrl: dz.previewUrl, previewExpiresAt: dz.previewExpiresAt },
            $addToSet: { deezerIds: deezerId },
            $setOnInsert: {
              deezerId,
              isrc: dz.isrc,
              title: dz.title,
              artistName: dz.artist,
              albumTitle: dz.album,
              albumId: dz.albumId,
              coverSmall: dz.coverSmall,
              coverMedium: dz.coverMedium,
              duration: dz.duration,
              explicit: dz.explicit,
              deezerLink: dz.link,
              genre: null,
              hidden: false,
              played: false,
              playedAt: null,
              firstAddedAt: now,
            },
          },
          { upsert: true, new: true },
        )
        .lean();
    try {
      return await run();
    } catch (e) {
      // Two concurrent upserts creating the same trackKey: the loser retries as an update.
      if (isDuplicateKeyError(e)) return run();
      throw e;
    }
  }

  /** Background, best effort: Deezer /search has no genre (ADR D5). */
  private async fillGenre(dz: DeezerTrack): Promise<void> {
    try {
      const genre = await this.deezer.getAlbumGenre(dz.albumId);
      if (genre) await this.tracks.updateOne({ trackKey: dz.trackKey, genre: null }, { $set: { genre } });
    } catch (e) {
      this.logger.warn(`Genre non récupéré pour ${dz.trackKey}: ${(e as Error).message}`);
    }
  }
}
