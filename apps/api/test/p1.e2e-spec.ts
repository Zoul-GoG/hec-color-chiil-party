import request from 'supertest';
import type { Server } from 'node:http';
import { csvCell } from '../src/admin/tracks/admin-tracks.service';
import { createTestApp, newGuest, type TestApp } from './utils';

describe('P1 features (e2e)', () => {
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

  describe('US-11 submissions open/close', () => {
    afterEach(async () => {
      await request(server)
        .patch('/api/admin/settings')
        .set('Cookie', cookie)
        .send({ submissionsOpen: true });
    });

    it('public settings default to open', async () => {
      const { body } = await request(server).get('/api/settings/public').expect(200);
      expect(body).toEqual({
        submissionsOpen: true,
        eventName: 'HEC Color & Chill Party',
        eventDate: '2026-11-27T19:00:00Z',
      });
    });

    it('closing blocks additions with 403 SUBMISSIONS_CLOSED; reopening allows them', async () => {
      await request(server).patch('/api/admin/settings').send({ submissionsOpen: false }).expect(401);
      const closed = await request(server)
        .patch('/api/admin/settings')
        .set('Cookie', cookie)
        .send({ submissionsOpen: false })
        .expect(200);
      expect(closed.body).toEqual({ submissionsOpen: false });
      expect((await request(server).get('/api/settings/public')).body.submissionsOpen).toBe(false);
      const res = await request(server)
        .post('/api/additions')
        .set('X-Guest-Id', newGuest())
        .send({ deezerId: 745229932 })
        .expect(403);
      expect(res.body).toEqual({
        statusCode: 403,
        code: 'SUBMISSIONS_CLOSED',
        message: 'Les propositions sont closes, place à la fête !',
      });
      // The playlist stays readable.
      await request(server).get('/api/tracks').expect(200);

      await request(server)
        .patch('/api/admin/settings')
        .set('Cookie', cookie)
        .send({ submissionsOpen: true })
        .expect(200);
      await request(server)
        .post('/api/additions')
        .set('X-Guest-Id', newGuest())
        .send({ deezerId: 745229932 })
        .expect(201);
    });

    it('validates the body', async () => {
      await request(server)
        .patch('/api/admin/settings')
        .set('Cookie', cookie)
        .send({ submissionsOpen: 'no' })
        .expect(400);
    });
  });

  describe('US-10 CSV export', () => {
    it('requires auth', async () => {
      await request(server).get('/api/admin/tracks/export.csv').expect(401);
    });

    it('exports the filtered ranking with BOM, ; separator and the contract columns', async () => {
      await t.clearDb();
      await request(server)
        .post('/api/additions')
        .set('X-Guest-Id', newGuest())
        .send({ deezerId: 745229932 })
        .expect(201);
      await request(server)
        .post('/api/additions')
        .set('X-Guest-Id', newGuest())
        .send({ deezerId: 1014597302 })
        .expect(201);
      await t.trackModel.updateOne({}, { $set: { played: true, genre: 'Rap/Hip Hop' } });

      const res = await request(server)
        .get('/api/admin/tracks/export.csv?status=all')
        .set('Cookie', cookie)
        .buffer(true)
        .parse((r, cb) => {
          let data = '';
          r.setEncoding('utf8');
          r.on('data', (c: string) => (data += c));
          r.on('end', () => cb(null, data));
        });
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(res.headers['content-disposition']).toMatch(
        /attachment; filename="color-chill-classement-\d+\.csv"/,
      );
      const text = res.body as string;
      expect(text.charCodeAt(0)).toBe(0xfeff);
      const lines = text.slice(1).trim().split('\r\n');
      expect(lines[0]).toBe(
        'rang;titre;artiste;album;genre;ajouts;premier_ajout;dernier_ajout;joue;lien_deezer',
      );
      expect(lines).toHaveLength(2);
      const cols = lines[1].split(';');
      expect(cols.slice(0, 6)).toEqual(['1', 'Bâtiment', 'Niska', 'Mr Sal', 'Rap/Hip Hop', '2']);
      expect(cols[6]).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
      expect(cols[8]).toBe('oui');
      expect(cols[9]).toBe('https://www.deezer.com/track/745229932');

      const hidden = await request(server)
        .get('/api/admin/tracks/export.csv?status=hidden')
        .set('Cookie', cookie);
      expect(hidden.text.trim().split('\r\n')).toHaveLength(1);
    });

    it('escapes cells and neutralises formulas', () => {
      expect(csvCell('a;b')).toBe('"a;b"');
      expect(csvCell('say "hi"')).toBe('"say ""hi"""');
      expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
      expect(csvCell('-1')).toBe("'-1");
      expect(csvCell(12)).toBe('12');
    });
  });
});
