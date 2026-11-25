import request from 'supertest';
import type { Server } from 'node:http';
import { fixture } from './fake-deezer';
import { createTestApp, newGuest, type TestApp } from './utils';

const BATIMENT = 745229932;
const BATIMENT_ALT = 1014597302; // same ISRC FR9W11916593
const KEY = 'isrc:FR9W11916593';

describe('Public API (e2e)', () => {
  let t: TestApp;
  let server: Server;

  beforeAll(async () => {
    t = await createTestApp();
    server = t.app.getHttpServer();
  });
  afterAll(async () => {
    await t.close();
  });
  beforeEach(async () => {
    await t.clearDb();
  });

  const add = (deezerId: number, guestId?: string) => {
    const req = request(server).post('/api/additions').send({ deezerId });
    return guestId ? req.set('X-Guest-Id', guestId) : req;
  };

  describe('POST /api/additions', () => {
    it('adds a new track -> 201 created', async () => {
      const res = await add(BATIMENT, newGuest()).expect(201);
      expect(res.body).toMatchObject({ created: true, alreadyAddedByMe: false, othersCount: 0 });
      expect(res.body.track).toMatchObject({
        trackKey: KEY,
        deezerId: BATIMENT,
        title: 'Bâtiment',
        artist: 'Niska',
        addCount: 1,
        addedByMe: true,
        hasPreview: true,
      });
    });

    it('same guest twice -> 200 alreadyAddedByMe, count unchanged', async () => {
      const g = newGuest();
      await add(BATIMENT, g).expect(201);
      const res = await add(BATIMENT, g).expect(200);
      expect(res.body).toMatchObject({ created: false, alreadyAddedByMe: true, othersCount: 0 });
      expect(res.body.track.addCount).toBe(1);
      expect(await t.additionModel.countDocuments()).toBe(1);
    });

    it('second guest -> addCount 2, othersCount 1', async () => {
      await add(BATIMENT, newGuest()).expect(201);
      const res = await add(BATIMENT, newGuest()).expect(201);
      expect(res.body).toMatchObject({ created: false, othersCount: 1 });
      expect(res.body.track.addCount).toBe(2);
    });

    it('two Deezer ids with the same ISRC -> a single track counted twice', async () => {
      await add(BATIMENT, newGuest()).expect(201);
      await add(BATIMENT_ALT, newGuest()).expect(201);
      const tracks = await t.trackModel.find().lean();
      expect(tracks).toHaveLength(1);
      expect(tracks[0]).toMatchObject({ trackKey: KEY, addCount: 2, deezerId: BATIMENT });
      expect(tracks[0].deezerIds.sort()).toEqual([BATIMENT, BATIMENT_ALT].sort());
    });

    it('20 concurrent additions by 20 guests -> addCount exactly 20', async () => {
      await Promise.all(Array.from({ length: 20 }, () => add(BATIMENT, newGuest()).expect(201)));
      const track = await t.trackModel.findOne({ trackKey: KEY }).lean();
      expect(track?.addCount).toBe(20);
      expect(await t.trackModel.countDocuments()).toBe(1);
      expect(await t.additionModel.countDocuments()).toBe(20);
    });

    it('hidden track -> 409 TRACK_HIDDEN', async () => {
      await add(BATIMENT, newGuest()).expect(201);
      await t.trackModel.updateOne({ trackKey: KEY }, { hidden: true });
      const res = await add(BATIMENT_ALT, newGuest()).expect(409);
      expect(res.body).toEqual({
        statusCode: 409,
        code: 'TRACK_HIDDEN',
        message: "Ce morceau n'est pas disponible pour la soirée.",
      });
    });

    it('missing or invalid X-Guest-Id -> 400 INVALID_GUEST_ID', async () => {
      expect((await add(BATIMENT).expect(400)).body.code).toBe('INVALID_GUEST_ID');
      expect((await add(BATIMENT, 'not-a-uuid').expect(400)).body.code).toBe('INVALID_GUEST_ID');
    });

    it('invalid body -> 400 VALIDATION_ERROR; unknown Deezer id -> 404', async () => {
      const g = newGuest();
      const bad = await request(server).post('/api/additions').set('X-Guest-Id', g).send({ deezerId: 'x' });
      expect(bad.status).toBe(400);
      expect(bad.body.code).toBe('VALIDATION_ERROR');
      expect((await add(123, g).expect(404)).body.code).toBe('TRACK_NOT_FOUND');
    });

    it('fills the genre in background from /album', async () => {
      await add(BATIMENT, newGuest()).expect(201);
      for (let i = 0; i < 20; i++) {
        const tr = await t.trackModel.findOne({ trackKey: KEY }).lean();
        if (tr?.genre) break;
        await new Promise((r) => setTimeout(r, 25));
      }
      expect((await t.trackModel.findOne({ trackKey: KEY }).lean())?.genre).toBe('Rap/Hip Hop');
    });
  });

  describe('GET /api/tracks', () => {
    const seed = async () => {
      // Bâtiment x2 (alt id), then BAHI x1 (from search fixture/track cache)
      await request(server).get('/api/search?q=bahi').set('X-Guest-Id', newGuest()).expect(200);
      const g1 = newGuest();
      await add(BATIMENT, g1).expect(201);
      await add(4184772842, newGuest()).expect(201); // BAHI, via search cache
      await add(BATIMENT_ALT, newGuest()).expect(201);
      return g1;
    };

    it('popular: addCount desc, addedByMe from header, hidden excluded', async () => {
      const g1 = await seed();
      const res = await request(server).get('/api/tracks?sort=popular').set('X-Guest-Id', g1).expect(200);
      expect(res.body).toMatchObject({ total: 2, page: 1, limit: 24, hasMore: false });
      expect(
        res.body.items.map((i: { title: string; addCount: number; addedByMe: boolean }) => [
          i.title,
          i.addCount,
          i.addedByMe,
        ]),
      ).toEqual([
        ['Bâtiment', 2, true],
        ['BAHI (feat. OG Mahilet)', 1, false],
      ]);
      await t.trackModel.updateOne({ trackKey: KEY }, { hidden: true });
      const after = await request(server).get('/api/tracks').expect(200);
      expect(after.body.total).toBe(1);
    });

    it('recent: firstAddedAt desc + pagination', async () => {
      await seed();
      const res = await request(server).get('/api/tracks?sort=recent&limit=1').expect(200);
      expect(res.body.items[0].title).toBe('BAHI (feat. OG Mahilet)');
      expect(res.body.hasMore).toBe(true);
      await request(server).get('/api/tracks?limit=51').expect(400);
    });
  });

  describe('GET /api/search', () => {
    it('returns 8 deduped results enriched with addCount / addedByMe', async () => {
      const g = newGuest();
      await add(BATIMENT_ALT, g).expect(201);
      const res = await request(server).get('/api/search?q=bahi').set('X-Guest-Id', g).expect(200);
      expect(res.body.items).toHaveLength(8);
      const keys = res.body.items.map((i: { trackKey: string }) => i.trackKey);
      expect(new Set(keys).size).toBe(8);
      const bat = res.body.items.find((i: { trackKey: string }) => i.trackKey === KEY);
      expect(bat).toMatchObject({ deezerId: BATIMENT, addCount: 1, addedByMe: true, explicit: true });
      expect(bat.previewUrl).toContain('dzcdn.net');
    });

    it('excludes hidden tracks', async () => {
      await add(BATIMENT, newGuest()).expect(201);
      await t.trackModel.updateOne({ trackKey: KEY }, { hidden: true });
      const res = await request(server).get('/api/search?q=bahi').expect(200);
      expect(res.body.items.some((i: { trackKey: string }) => i.trackKey === KEY)).toBe(false);
    });

    it('validates q length (3..80)', async () => {
      expect((await request(server).get('/api/search?q=ab').expect(400)).body.code).toBe('VALIDATION_ERROR');
      await request(server)
        .get(`/api/search?q=${'a'.repeat(81)}`)
        .expect(400);
      await request(server).get('/api/search?q=%20%20ab%20').expect(400);
    });

    it('Deezer error -> 503 DEEZER_UNAVAILABLE', async () => {
      t.deezer.override('/search', () => ({ error: { code: 500, message: 'boom' } }));
      const res = await request(server).get('/api/search?q=unknown-query').expect(503);
      expect(res.body.code).toBe('DEEZER_UNAVAILABLE');
      t.deezer.reset();
    });
  });

  describe('GET /api/tracks/:trackKey/preview', () => {
    it('refreshes an expired preview from Deezer, then serves the stored one', async () => {
      await add(BATIMENT, newGuest()).expect(201);
      // Fixture previews already expired -> refresh with a fresh URL valid 15 min.
      const exp = Math.floor(Date.now() / 1000) + 900;
      t.deezer.reset();
      t.deezer.override('/track/', () => ({
        ...fixture<object>('deezer-track.json'),
        preview: `https://cdnt-preview.dzcdn.net/x.mp3?hdnea=exp=${exp}~acl=x`,
      }));
      const res = await request(server)
        .get(`/api/tracks/${encodeURIComponent(KEY)}/preview`)
        .expect(200);
      expect(res.body.previewUrl).toContain(`exp=${exp}`);
      expect(t.deezer.count('/track/')).toBe(1);
      await request(server)
        .get(`/api/tracks/${encodeURIComponent(KEY)}/preview`)
        .expect(200);
      expect(t.deezer.count('/track/')).toBe(1);
      t.deezer.reset();
    });

    it('unknown track: uses deezerId if it matches, else 404', async () => {
      const ok = await request(server)
        .get(`/api/tracks/${encodeURIComponent(KEY)}/preview?deezerId=${BATIMENT_ALT}`)
        .expect(200);
      expect(ok.body.previewUrl).toContain('dzcdn.net');
      await request(server).get('/api/tracks/dz:1/preview').expect(404);
      await request(server).get(`/api/tracks/dz:1/preview?deezerId=${BATIMENT}`).expect(404);
    });
  });
});
