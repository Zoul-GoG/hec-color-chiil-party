import request from 'supertest';
import type { Server } from 'node:http';
import { createTestApp, type TestApp } from './utils';

const EMAIL = 'admin@test.local';
const PASSWORD = 'test-password-123';

describe('Admin auth (e2e)', () => {
  let t: TestApp;
  let server: Server;

  beforeAll(async () => {
    t = await createTestApp();
    server = t.app.getHttpServer();
  });
  afterAll(async () => {
    await t.close();
  });

  const login = (body: object, ip = '10.0.0.1') =>
    request(server).post('/api/admin/auth/login').set('X-Forwarded-For', ip).send(body);

  const cookieOf = (res: request.Response): string => {
    const raw = res.headers['set-cookie'] as unknown as string[];
    return raw.find((c) => c.startsWith('hcc_admin='))!;
  };

  it('wrong password -> 401 INVALID_CREDENTIALS, generic message', async () => {
    const res = await login({ email: EMAIL, password: 'nope' }).expect(401);
    expect(res.body).toEqual({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'Email ou mot de passe incorrect.',
    });
    const unknown = await login({ email: 'who@x.io', password: 'nope' }).expect(401);
    expect(unknown.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('good credentials -> httpOnly cookie (12 h) and /me 200', async () => {
    const res = await login({ email: ' Admin@Test.local ', password: PASSWORD }, '10.0.0.2').expect(200);
    expect(res.body).toEqual({ email: EMAIL });
    const cookie = cookieOf(res);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Path=\/api/);
    expect(cookie).toMatch(/Max-Age=43200/);
    const me = await request(server)
      .get('/api/admin/auth/me')
      .set('Cookie', cookie.split(';')[0])
      .expect(200);
    expect(me.body).toEqual({ email: EMAIL });
  });

  it('remember me -> 7 day cookie', async () => {
    const res = await login({ email: EMAIL, password: PASSWORD, remember: true }, '10.0.0.3').expect(200);
    expect(cookieOf(res)).toMatch(/Max-Age=604800/);
  });

  it('admin route without cookie / with forged cookie -> 401 UNAUTHORIZED', async () => {
    const res = await request(server).get('/api/admin/auth/me').expect(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
    await request(server)
      .get('/api/admin/auth/me')
      .set('Cookie', 'hcc_admin=eyJhbGciOiJIUzI1NiJ9.e30.x')
      .expect(401);
  });

  it('logout -> cookie cleared, /me 401', async () => {
    const res = await login({ email: EMAIL, password: PASSWORD }, '10.0.0.4').expect(200);
    const out = await request(server)
      .post('/api/admin/auth/logout')
      .set('Cookie', cookieOf(res).split(';')[0])
      .expect(204);
    const cleared = cookieOf(out);
    expect(cleared).toMatch(/hcc_admin=;/);
    await request(server).get('/api/admin/auth/me').set('Cookie', cleared.split(';')[0]).expect(401);
  });

  it('5 failed attempts / IP -> 429, even with the right password; other IPs unaffected', async () => {
    const ip = '10.0.0.99';
    for (let i = 0; i < 5; i++) await login({ email: EMAIL, password: 'bad' }, ip).expect(401);
    const blocked = await login({ email: EMAIL, password: PASSWORD }, ip).expect(429);
    expect(blocked.body.code).toBe('RATE_LIMITED');
    await login({ email: EMAIL, password: PASSWORD }, '10.0.0.100').expect(200);
  });

  it('successful logins do not count towards the limit', async () => {
    const ip = '10.0.0.50';
    for (let i = 0; i < 7; i++) await login({ email: EMAIL, password: PASSWORD }, ip).expect(200);
  });

  it('validates the body', async () => {
    expect((await login({ email: 'not-an-email', password: 'x' }).expect(400)).body.code).toBe(
      'VALIDATION_ERROR',
    );
  });

  it('seed is idempotent and does not rehash an unchanged password', async () => {
    const { AdminSeedService } = await import('../src/admin/auth/admin-seed.service');
    expect(await t.app.get(AdminSeedService).seed()).toBe('unchanged');
  });
});
