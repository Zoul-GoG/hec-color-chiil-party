import request from 'supertest';
import { createTestApp, type TestApp } from './utils';

describe('Health (e2e)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.close();
  });

  it('GET /api/health -> ok / db up', async () => {
    const res = await request(t.app.getHttpServer()).get('/api/health').expect(200);
    expect(res.body).toEqual({ status: 'ok', db: 'up' });
  });

  it('unknown API route -> unified error format', async () => {
    const res = await request(t.app.getHttpServer()).get('/api/nope').expect(404);
    expect(res.body).toEqual({ statusCode: 404, code: 'NOT_FOUND', message: 'Ressource introuvable.' });
  });

  it('sets security headers (helmet)', async () => {
    const res = await request(t.app.getHttpServer()).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
