import request from 'supertest';
import type { Server } from 'node:http';
import { createTestApp, type TestApp } from './utils';

const MIN = 60_000;

describe('Admin dashboard API (e2e)', () => {
  let t: TestApp;
  let server: Server;
  let cookie: string;

  beforeAll(async () => {
    t = await createTestApp();
    server = t.app.getHttpServer();
    const res = await request(server)
      .post('/api/admin/auth/login')
      .send({ email: 'admin@test.local', password: 'test-password-123' })
      .expect(200);
    cookie = (res.headers['set-cookie'] as unknown as string[])[0].split(';')[0];
  });
  afterAll(async () => {
    await t.close();
  });

  beforeEach(async () => {
    await t.clearDb();
    const now = Date.now();
    const ago = (m: number) => new Date(now - m * MIN);
    const track = (
      key: string,
      title: string,
      artistName: string,
      genre: string | null,
      addCount: number,
      extra = {},
    ) => ({
      trackKey: key,
      isrc: null,
      deezerId: Number(key.slice(3)),
      deezerIds: [Number(key.slice(3))],
      title,
      artistName,
      albumTitle: 'X',
      albumId: 1,
      coverSmall: '',
      coverMedium: '',
      duration: 200,
      explicit: false,
      deezerLink: '',
      previewUrl: null,
      previewExpiresAt: null,
      genre,
      addCount,
      firstAddedAt: ago(300),
      lastAddedAt: ago(10),
      hidden: false,
      played: false,
      playedAt: null,
      ...extra,
    });
    await t.trackModel.collection.insertMany([
      track('dz:1', 'Party', 'Didi B', 'Rap/Hip Hop', 3, { lastAddedAt: ago(10), firstAddedAt: ago(180) }),
      track('dz:2', 'Adios', 'Didi B', 'Rap/Hip Hop', 2, { lastAddedAt: ago(20), firstAddedAt: ago(30) }),
      track('dz:3', '1er Gaou', 'Magic System', 'Musique africaine', 2, {
        lastAddedAt: ago(70),
        firstAddedAt: ago(300),
        played: true,
        playedAt: ago(5),
        explicit: true,
      }),
      track('dz:4', 'Dai Dai', 'Shakira', null, 1, { lastAddedAt: ago(240), firstAddedAt: ago(240) }),
      track('dz:5', 'Bad', 'Hidden Guy', 'Dance', 5, {
        hidden: true,
        lastAddedAt: ago(150),
        firstAddedAt: ago(150),
      }),
    ]);
    const add = (trackKey: string, guestId: string, m: number) => ({
      trackKey,
      deezerId: 1,
      guestId,
      ipHash: 'x',
      createdAt: ago(m),
      updatedAt: ago(m),
    });
    await t.additionModel.collection.insertMany([
      add('dz:1', 'g1', 10),
      add('dz:1', 'g2', 90),
      add('dz:1', 'g3', 180),
      add('dz:2', 'g1', 20),
      add('dz:2', 'g2', 30),
      add('dz:3', 'g4', 70),
      add('dz:3', 'g5', 300),
      add('dz:4', 'g1', 240),
      ...['g6', 'g7', 'g8', 'g9', 'g10'].map((g) => add('dz:5', g, 150)),
    ]);
  });

  const get = (path: string) => request(server).get(path).set('Cookie', cookie);

  it('requires the admin cookie', async () => {
    expect((await request(server).get('/api/admin/stats').expect(401)).body.code).toBe('UNAUTHORIZED');
    await request(server).get('/api/admin/tracks').expect(401);
    await request(server).patch('/api/admin/tracks/dz:1').send({ played: true }).expect(401);
  });

  it('stats range=all: exact values', async () => {
    const { body } = await get('/api/admin/stats?range=all').expect(200);
    expect(body).toMatchObject({
      range: 'all',
      uniqueTracks: 4,
      totalAdditions: 13,
      uniqueGuests: 10,
      additionsLastHour: 3,
      additionsPrevHour: 2,
      topArtist: { name: 'Didi B', count: 5 },
      genres: [
        { name: 'Rap/Hip Hop', count: 5, share: 0.625 },
        { name: 'Musique africaine', count: 2, share: 0.25 },
        { name: 'Autres', count: 1, share: 0.125 },
      ],
    });
    const tl = body.timeline as { bucketStart: string; count: number }[];
    expect(tl.reduce((s, b) => s + b.count, 0)).toBe(13);
    expect(tl.length).toBeGreaterThanOrEqual(20);
    expect(tl.length).toBeLessThanOrEqual(48);
    expect(new Date(tl[1].bucketStart).getTime() - new Date(tl[0].bucketStart).getTime()).toBe(15 * MIN);
    expect(new Date(tl[0].bucketStart).getUTCMinutes() % 15).toBe(0);
  });

  it('stats range=1h: only the last hour', async () => {
    const { body } = await get('/api/admin/stats?range=1h').expect(200);
    expect(body).toMatchObject({
      range: '1h',
      uniqueTracks: 2,
      totalAdditions: 3,
      uniqueGuests: 2,
      topArtist: { name: 'Didi B', count: 3 },
      genres: [{ name: 'Rap/Hip Hop', count: 3, share: 1 }],
    });
    expect(body.timeline).toHaveLength(5);
    await get('/api/admin/stats?range=week').expect(400);
  });

  it('stats with no data', async () => {
    await t.clearDb();
    const { body } = await get('/api/admin/stats').expect(200);
    expect(body).toMatchObject({
      uniqueTracks: 0,
      totalAdditions: 0,
      topArtist: null,
      genres: [],
      timeline: [],
    });
  });

  const titles = (body: { items: { title: string }[] }) => body.items.map((i) => i.title);

  it('tracks: default ranking with dense global rank and genre chips', async () => {
    const { body } = await get('/api/admin/tracks').expect(200);
    expect(titles(body)).toEqual(['Party', 'Adios', '1er Gaou', 'Dai Dai']);
    expect(body.items.map((i: { rank: number }) => i.rank)).toEqual([1, 2, 2, 3]);
    expect(body).toMatchObject({ total: 4, page: 1, limit: 50, hasMore: false });
    expect(body.genres).toEqual([
      { name: 'Rap/Hip Hop', count: 2 },
      { name: 'Autres', count: 1 },
      { name: 'Musique africaine', count: 1 },
    ]);
    expect(body.items[2]).toMatchObject({ played: true, hidden: false, addedByMe: false });
  });

  it('tracks: status filters', async () => {
    expect(titles((await get('/api/admin/tracks?status=hidden').expect(200)).body)).toEqual(['Bad']);
    expect(titles((await get('/api/admin/tracks?status=played').expect(200)).body)).toEqual(['1er Gaou']);
    expect(titles((await get('/api/admin/tracks?status=toplay').expect(200)).body)).toEqual([
      'Party',
      'Adios',
      'Dai Dai',
    ]);
  });

  it('tracks: sorts', async () => {
    expect(titles((await get('/api/admin/tracks?sort=count_asc').expect(200)).body)[0]).toBe('Dai Dai');
    expect(titles((await get('/api/admin/tracks?sort=alpha').expect(200)).body)).toEqual([
      '1er Gaou',
      'Adios',
      'Dai Dai',
      'Party',
    ]);
    expect(titles((await get('/api/admin/tracks?sort=recent').expect(200)).body)[0]).toBe('Adios');
  });

  it('tracks: text search (escaped regex), genre, explicit, range, pagination', async () => {
    expect((await get('/api/admin/tracks?q=(').expect(200)).body.total).toBe(0);
    expect(titles((await get('/api/admin/tracks?q=didi').expect(200)).body)).toEqual(['Party', 'Adios']);
    expect(titles((await get('/api/admin/tracks?q=GAOU').expect(200)).body)).toEqual(['1er Gaou']);
    expect(titles((await get('/api/admin/tracks?genre=Autres').expect(200)).body)).toEqual(['Dai Dai']);
    expect(
      titles((await get(`/api/admin/tracks?genre=${encodeURIComponent('Rap/Hip Hop')}`).expect(200)).body),
    ).toEqual(['Party', 'Adios']);
    expect(titles((await get('/api/admin/tracks?explicit=exclude').expect(200)).body)).not.toContain(
      '1er Gaou',
    );
    expect(titles((await get('/api/admin/tracks?range=1h').expect(200)).body)).toEqual(['Party', 'Adios']);
    const p2 = (await get('/api/admin/tracks?limit=3&page=2').expect(200)).body;
    expect(p2).toMatchObject({ total: 4, page: 2, hasMore: false });
    expect(titles(p2)).toEqual(['Dai Dai']);
    await get('/api/admin/tracks?sort=nope').expect(400);
  });

  it('PATCH played / hidden', async () => {
    const played = await request(server)
      .patch('/api/admin/tracks/dz:1')
      .set('Cookie', cookie)
      .send({ played: true })
      .expect(200);
    expect(played.body).toMatchObject({ trackKey: 'dz:1', played: true, rank: 1 });
    expect(played.body.playedAt).toBeTruthy();
    const unplayed = await request(server)
      .patch('/api/admin/tracks/dz:1')
      .set('Cookie', cookie)
      .send({ played: false })
      .expect(200);
    expect(unplayed.body).toMatchObject({ played: false, playedAt: null });

    await request(server)
      .patch('/api/admin/tracks/dz:1')
      .set('Cookie', cookie)
      .send({ hidden: true })
      .expect(200);
    const pub = await request(server).get('/api/tracks').expect(200);
    expect(pub.body.items.map((i: { title: string }) => i.title)).not.toContain('Party');
    await request(server)
      .patch('/api/admin/tracks/dz:404')
      .set('Cookie', cookie)
      .send({ hidden: true })
      .expect(404);
    await request(server)
      .patch('/api/admin/tracks/dz:1')
      .set('Cookie', cookie)
      .send({ hidden: 'yes' })
      .expect(400);
  });
});
