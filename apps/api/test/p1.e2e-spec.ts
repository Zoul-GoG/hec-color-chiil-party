import request from 'supertest';
import type { Server } from 'node:http';
import ExcelJS from 'exceljs';
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

  describe('US-10 Excel export', () => {
    it('requires auth', async () => {
      await request(server).get('/api/admin/tracks/export.xlsx').expect(401);
    });

    it('exports the filtered ranking as .xlsx, hidden tracks excluded', async () => {
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

      const download = (path: string) =>
        request(server)
          .get(path)
          .set('Cookie', cookie)
          .buffer(true)
          .parse((r, cb) => {
            const chunks: Buffer[] = [];
            r.on('data', (c: Buffer) => chunks.push(c));
            r.on('end', () => cb(null, Buffer.concat(chunks)));
          });
      const readRows = async (buf: Buffer) => {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buf as unknown as ArrayBuffer);
        const ws = wb.getWorksheet('Classement')!;
        return ws.getSheetValues().filter(Boolean) as unknown[][];
      };

      const res = await download('/api/admin/tracks/export.xlsx');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(res.headers['content-disposition']).toMatch(
        /attachment; filename="color-chill-classement-\d+\.xlsx"/,
      );
      const rows = await readRows(res.body as Buffer);
      expect(rows[0].slice(1)).toEqual([
        'Rang',
        'Titre',
        'Artiste',
        'Album',
        'Genre',
        'Ajouts',
        'Premier ajout',
        'Dernier ajout',
        'Joué',
        'Lien Deezer',
      ]);
      expect(rows).toHaveLength(2);
      expect(rows[1].slice(1, 7)).toEqual([1, 'Bâtiment', 'Niska', 'Mr Sal', 'Rap/Hip Hop', 2]);
      expect(rows[1][7]).toBeInstanceOf(Date);
      expect(rows[1][9]).toBe('oui');
      expect(rows[1][10]).toMatchObject({ hyperlink: 'https://www.deezer.com/track/745229932' });

      await t.trackModel.updateOne({}, { $set: { hidden: true } });
      expect(await readRows((await download('/api/admin/tracks/export.xlsx')).body as Buffer)).toHaveLength(
        1,
      );
    });

    it('writes formula-looking titles as plain text', async () => {
      await t.trackModel.updateOne({}, { $set: { hidden: false, title: '=HYPERLINK("x")' } });
      const res = await request(server)
        .get('/api/admin/tracks/export.xlsx')
        .set('Cookie', cookie)
        .buffer(true)
        .parse((r, cb) => {
          const chunks: Buffer[] = [];
          r.on('data', (c: Buffer) => chunks.push(c));
          r.on('end', () => cb(null, Buffer.concat(chunks)));
        });
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(res.body as unknown as ArrayBuffer);
      const cell = wb.getWorksheet('Classement')!.getCell('B2');
      expect(cell.type).toBe(ExcelJS.ValueType.String);
      expect(cell.value).toBe('=HYPERLINK("x")');
    });
  });
});
