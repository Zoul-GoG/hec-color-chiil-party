import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Addition } from '../additions/addition.schema';
import { Track } from '../tracks/track.schema';

/** Recomputes tracks.addCount from the additions collection (docs/04 §6). Returns tracks changed. */
export async function recount(tracks: Model<Track>, additions: Model<Addition>): Promise<number> {
  const counts = await additions.aggregate<{ _id: string; count: number }>([
    { $group: { _id: '$trackKey', count: { $sum: 1 } } },
  ]);
  const byKey = new Map(counts.map((c) => [c._id, c.count]));
  const docs = await tracks.find({}, { trackKey: 1, addCount: 1 }).lean();
  const ops = docs
    .filter((d) => (byKey.get(d.trackKey) ?? 0) !== d.addCount)
    .map((d) => ({
      updateOne: {
        filter: { trackKey: d.trackKey },
        update: { $set: { addCount: byKey.get(d.trackKey) ?? 0 } },
      },
    }));
  if (ops.length) await tracks.bulkWrite(ops);
  return ops.length;
}

/** Empties additions and tracks (admin account kept). */
export async function resetData(
  tracks: Model<Track>,
  additions: Model<Addition>,
): Promise<{ tracks: number; additions: number }> {
  const [a, t] = await Promise.all([additions.deleteMany({}), tracks.deleteMany({})]);
  return { tracks: t.deletedCount, additions: a.deletedCount };
}

export const modelTokens = { track: getModelToken(Track.name), addition: getModelToken(Addition.name) };
