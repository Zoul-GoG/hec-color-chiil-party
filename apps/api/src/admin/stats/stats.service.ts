import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Range, StatsDto } from '@hcc/shared';
import type { Model } from 'mongoose';
import { Addition } from '../../additions/addition.schema';
import { Track } from '../../tracks/track.schema';

export const OTHER_GENRE = 'Autres';
const HOUR = 60 * 60_000;
const MIN15 = 15 * 60_000;
const MAX_BUCKETS = 48;

interface TrackCount {
  artistName: string;
  genre: string | null;
  count: number;
}

/** Dashboard KPIs (docs/03 §4, docs/04 §5). */
@Injectable()
export class StatsService {
  constructor(
    @InjectModel(Track.name) private readonly tracks: Model<Track>,
    @InjectModel(Addition.name) private readonly additions: Model<Addition>,
  ) {}

  async get(range: Range, now = new Date()): Promise<StatsDto> {
    const t = now.getTime();
    const hourAgo = new Date(t - HOUR);
    const twoHoursAgo = new Date(t - 2 * HOUR);
    const since = range === '1h' ? hourAgo : null;
    const additionFilter = since ? { createdAt: { $gte: since } } : {};

    const [lastHour, prevHour, totalAdditions, guests, rows, timeline] = await Promise.all([
      this.additions.countDocuments({ createdAt: { $gte: hourAgo } }),
      this.additions.countDocuments({ createdAt: { $gte: twoHoursAgo, $lt: hourAgo } }),
      this.additions.countDocuments(additionFilter),
      this.additions.distinct('guestId', additionFilter),
      since ? this.countsSince(since) : this.countsAll(),
      this.timeline(range, now),
    ]);

    return {
      range,
      uniqueTracks: rows.length,
      totalAdditions,
      uniqueGuests: guests.length,
      additionsLastHour: lastHour,
      additionsPrevHour: prevHour,
      topArtist: topArtist(rows),
      genres: genreShares(rows),
      timeline,
      generatedAt: now.toISOString(),
    };
  }

  private async countsAll(): Promise<TrackCount[]> {
    const docs = await this.tracks
      .find({ hidden: false, addCount: { $gt: 0 } }, { artistName: 1, genre: 1, addCount: 1, _id: 0 })
      .lean();
    return docs.map((d) => ({ artistName: d.artistName, genre: d.genre, count: d.addCount }));
  }

  /** Per-track additions since a date, hidden tracks excluded. */
  private countsSince(since: Date): Promise<TrackCount[]> {
    return this.additions.aggregate<TrackCount>([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: '$trackKey', count: { $sum: 1 } } },
      { $lookup: { from: 'tracks', localField: '_id', foreignField: 'trackKey', as: 't' } },
      { $unwind: '$t' },
      { $match: { 't.hidden': false } },
      { $project: { _id: 0, count: 1, artistName: '$t.artistName', genre: '$t.genre' } },
    ]);
  }

  /** 15-min buckets (30 min beyond 48), empty buckets filled with 0. */
  private async timeline(range: Range, now: Date): Promise<StatsDto['timeline']> {
    const t = now.getTime();
    let start: number;
    if (range === '1h') {
      start = t - HOUR;
    } else {
      const first = await this.additions.findOne({}, { createdAt: 1 }).sort({ createdAt: 1 }).lean();
      if (!first) return [];
      start = first.createdAt.getTime();
    }
    let bin = MIN15;
    if ((t - Math.floor(start / bin) * bin) / bin + 1 > MAX_BUCKETS) bin = 2 * MIN15;
    const lastBucket = Math.floor(t / bin) * bin;
    const firstBucket = Math.max(Math.floor(start / bin) * bin, lastBucket - (MAX_BUCKETS - 1) * bin);

    const counts = await this.additions.aggregate<{ _id: Date; count: number }>([
      { $match: { createdAt: { $gte: new Date(firstBucket) } } },
      {
        $group: {
          _id: { $dateTrunc: { date: '$createdAt', unit: 'minute', binSize: bin / 60_000 } },
          count: { $sum: 1 },
        },
      },
    ]);
    const byStart = new Map(counts.map((c) => [new Date(c._id).getTime(), c.count]));
    const out: StatsDto['timeline'] = [];
    for (let b = firstBucket; b <= lastBucket; b += bin) {
      out.push({ bucketStart: new Date(b).toISOString(), count: byStart.get(b) ?? 0 });
    }
    return out;
  }
}

export function topArtist(rows: TrackCount[]): StatsDto['topArtist'] {
  const byArtist = new Map<string, number>();
  for (const r of rows) byArtist.set(r.artistName, (byArtist.get(r.artistName) ?? 0) + r.count);
  let best: StatsDto['topArtist'] = null;
  for (const [name, count] of byArtist) {
    if (!best || count > best.count || (count === best.count && name.localeCompare(best.name, 'fr') < 0)) {
      best = { name, count };
    }
  }
  return best;
}

/** Top 4 genres by additions + "Autres" (incl. unknown genre). */
export function genreShares(rows: TrackCount[]): StatsDto['genres'] {
  const total = rows.reduce((s, r) => s + r.count, 0);
  if (total === 0) return [];
  const byGenre = new Map<string, number>();
  let other = 0;
  for (const r of rows) {
    if (!r.genre) other += r.count;
    else byGenre.set(r.genre, (byGenre.get(r.genre) ?? 0) + r.count);
  }
  const sorted = [...byGenre.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'fr'));
  const top = sorted.slice(0, 4);
  other += sorted.slice(4).reduce((s, [, c]) => s + c, 0);
  const out = top.map(([name, count]) => ({ name, count, share: count / total }));
  if (other > 0) out.push({ name: OTHER_GENRE, count: other, share: other / total });
  return out;
}
