import request from 'supertest';
import type { Server } from 'node:http';
import { createTestApp, newGuest, type TestApp } from './utils';

describe('Rate limiting (e2e)', () => {
  let t: TestApp;
  let server: Server;

  beforeAll(async () => {
    t = await createTestApp();
    server = t.app.getHttpServer();
  });
  afterAll(async () => {
    await t.close();
  });

  it('no per-guest addition cap: 25 attempts by the same guest are all accepted', async () => {
    const g = newGuest();
    for (let i = 0; i < 25; i++) {
      const res = await request(server)
        .post('/api/additions')
        .set('X-Guest-Id', g)
        .send({ deezerId: 745229932 });
      expect(res.status).toBeLessThan(300);
    }
  });

  it('search: 40 / min per guest', async () => {
    const g = newGuest();
    for (let i = 0; i < 40; i++) {
      await request(server).get('/api/search?q=bahi').set('X-Guest-Id', g).expect(200);
    }
    await request(server).get('/api/search?q=bahi').set('X-Guest-Id', g).expect(429);
    await request(server).get('/api/search?q=bahi').set('X-Guest-Id', newGuest()).expect(200);
  });

  it('/api/tracks is only subject to the global limit', async () => {
    const g = newGuest();
    for (let i = 0; i < 45; i++) {
      await request(server).get('/api/tracks').set('X-Guest-Id', g).expect(200);
    }
  });
});
