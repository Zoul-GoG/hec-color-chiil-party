import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import ExcelJS from 'exceljs';
import { ErrorCode, type AdminSort, type AdminTrackDto, type AdminTracksResponseDto } from '@hcc/shared';
import type { FilterQuery, Model, SortOrder } from 'mongoose';
import { Addition } from '../../additions/addition.schema';
import { AppException } from '../../common/app.exception';
import { escapeRegex } from '../../common/utils';
import { toTrackDto } from '../../tracks/track.mapper';
import { Track } from '../../tracks/track.schema';
import { OTHER_GENRE } from '../stats/stats.service';
import type { AdminTrackPatchBodyDto, AdminTracksQueryDto } from './admin-tracks.dto';

const HOUR = 60 * 60_000;

const SORTS: Record<AdminSort, Record<string, SortOrder>> = {
  count_desc: { addCount: -1, lastAddedAt: -1, _id: 1 },
  count_asc: { addCount: 1, lastAddedAt: 1, _id: 1 },
  recent: { firstAddedAt: -1, _id: 1 },
  alpha: { title: 1, artistName: 1, _id: 1 },
};

@Injectable()
export class AdminTracksService {
  constructor(
    @InjectModel(Track.name) private readonly tracks: Model<Track>,
    @InjectModel(Addition.name) private readonly additions: Model<Addition>,
  ) {}

  /**
   * Filter without the genre criterion (used for genre chips counts).
   * Hidden tracks are listed too (flagged), so the admin can always unhide them.
   */
  private async baseFilter(q: AdminTracksQueryDto): Promise<FilterQuery<Track>> {
    const filter: FilterQuery<Track> = {};
    if (q.q) {
      const re = new RegExp(escapeRegex(q.q), 'i');
      filter.$or = [{ title: re }, { artistName: re }];
    }
    if (q.range === '1h') {
      const keys = await this.additions.distinct('trackKey', {
        createdAt: { $gte: new Date(Date.now() - HOUR) },
      });
      filter.trackKey = { $in: keys };
    }
    return filter;
  }

  async list(q: AdminTracksQueryDto): Promise<AdminTracksResponseDto> {
    const base = await this.baseFilter(q);
    const filter: FilterQuery<Track> = { ...base };
    if (q.genre) filter.genre = q.genre === OTHER_GENRE ? null : q.genre;

    const [docs, total, genreRows, rankCounts] = await Promise.all([
      this.tracks
        .find(filter)
        .collation({ locale: 'fr', strength: 1 })
        .sort(SORTS[q.sort])
        .skip((q.page - 1) * q.limit)
        .limit(q.limit)
        .lean(),
      this.tracks.countDocuments(filter),
      this.tracks.aggregate<{ _id: string | null; count: number }>([
        { $match: base },
        { $group: { _id: '$genre', count: { $sum: 1 } } },
      ]),
      this.rankCounts(),
    ]);

    const genres = genreRows
      .map((g) => ({ name: g._id ?? OTHER_GENRE, count: g.count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'fr'));

    return {
      items: docs.map((d) => toAdminDto(d, rankOf(d.addCount, rankCounts))),
      total,
      page: q.page,
      limit: q.limit,
      hasMore: q.page * q.limit < total,
      genres,
    };
  }

  /** US-10: Excel export of the ranking — same filters as the list, no pagination, hidden tracks excluded. */
  async exportXlsx(q: AdminTracksQueryDto): Promise<Buffer> {
    const filter: FilterQuery<Track> = { ...(await this.baseFilter(q)), hidden: false };
    if (q.genre) filter.genre = q.genre === OTHER_GENRE ? null : q.genre;
    const [docs, rankCounts] = await Promise.all([
      this.tracks.find(filter).collation({ locale: 'fr', strength: 1 }).sort(SORTS[q.sort]).lean(),
      this.rankCounts(),
    ]);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'HEC Color & Chill Party';
    wb.created = new Date();
    const ws = wb.addWorksheet('Classement', { views: [{ state: 'frozen', ySplit: 1 }] });
    ws.columns = [
      { header: 'Rang', key: 'rank', width: 7 },
      { header: 'Titre', key: 'title', width: 40 },
      { header: 'Artiste', key: 'artist', width: 28 },
      { header: 'Album', key: 'album', width: 32 },
      { header: 'Genre', key: 'genre', width: 20 },
      { header: 'Ajouts', key: 'count', width: 9 },
      { header: 'Premier ajout', key: 'first', width: 17, style: { numFmt: 'dd/mm/yyyy hh:mm' } },
      { header: 'Dernier ajout', key: 'last', width: 17, style: { numFmt: 'dd/mm/yyyy hh:mm' } },
      { header: 'Joué', key: 'played', width: 7 },
      { header: 'Lien Deezer', key: 'link', width: 38 },
    ];
    // Cells are written as plain values (never formulas), so there is no formula-injection risk.
    for (const t of docs) {
      ws.addRow({
        rank: rankOf(t.addCount, rankCounts),
        title: t.title,
        artist: t.artistName,
        album: t.albumTitle,
        genre: t.genre ?? OTHER_GENRE,
        count: t.addCount,
        first: new Date(t.firstAddedAt),
        last: new Date(t.lastAddedAt),
        played: t.played ? 'oui' : 'non',
        link: t.deezerLink ? { text: t.deezerLink, hyperlink: t.deezerLink } : '',
      });
    }
    const header = ws.getRow(1);
    header.font = { bold: true };
    header.alignment = { vertical: 'middle' };
    ws.autoFilter = { from: 'A1', to: 'J1' };
    return Buffer.from(await wb.xlsx.writeBuffer());
  }

  async patch(trackKey: string, body: AdminTrackPatchBodyDto): Promise<AdminTrackDto> {
    const $set: Partial<Track> = {};
    if (body.played !== undefined) {
      $set.played = body.played;
      $set.playedAt = body.played ? new Date() : null;
    }
    if (body.hidden !== undefined) $set.hidden = body.hidden;
    const doc = await this.tracks.findOneAndUpdate({ trackKey }, { $set }, { new: true }).lean();
    if (!doc) throw new AppException(ErrorCode.TRACK_NOT_FOUND);
    return toAdminDto(doc, rankOf(doc.addCount, await this.rankCounts()));
  }

  /** Distinct addCount values of visible tracks, desc — dense global rank. */
  private async rankCounts(): Promise<number[]> {
    const counts = await this.tracks.distinct('addCount', { hidden: false });
    return (counts as number[]).sort((a, b) => b - a);
  }
}

/** Dense rank: 1 + number of distinct visible counts strictly greater. */
export function rankOf(count: number, sortedDesc: number[]): number {
  let greater = 0;
  for (const c of sortedDesc) {
    if (c > count) greater++;
    else break;
  }
  return greater + 1;
}

function toAdminDto(t: Track, rank: number): AdminTrackDto {
  return {
    ...toTrackDto(t, false),
    rank,
    played: t.played,
    playedAt: t.playedAt ? new Date(t.playedAt).toISOString() : null,
    hidden: t.hidden,
  };
}
