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

  it('R6: 21st addition attempt by the same guest within 10 min -> 429 RATE_LIMITED', async () => {
    const g = newGuest();
    for (let i = 0; i < 20; i++) {
      await request(server).post('/api/additions').set('X-Guest-Id', g).send({ deezerId: 745229932 });
    }
    const res = await request(server)
      .post('/api/additions')
      .set('X-Guest-Id', g)
      .send({ deezerId: 745229932 });
    expect(res.status).toBe(429);
    expect(res.body).toEqual({
      statusCode: 429,
      code: 'RATE_LIMITED',
      message: 'Doucement DJ 😅 Réessaie dans un instant.',
    });
    // Another guest on the same (campus) IP is not blocked.
    await request(server)
      .post('/api/additions')
      .set('X-Guest-Id', newGuest())
      .send({ deezerId: 745229932 })
      .expect(201);
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
