import request from 'supertest';
import type { Server } from 'node:http';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Admin } from '../src/admin/auth/admin.schema';
import { AdminSeedService } from '../src/admin/auth/admin-seed.service';
import { createTestApp, type TestApp } from './utils';

const SUPER = 'admin@test.local';
const SUPER_PW = 'test-password-123';

describe('Admin user management (e2e)', () => {
  let t: TestApp;
  let server: Server;
  let admins: Model<Admin>;
  let ipN = 0;

  beforeAll(async () => {
    t = await createTestApp();
    server = t.app.getHttpServer();
    admins = t.app.get(getModelToken(Admin.name));
  });
  afterAll(async () => {
    await t.close();
  });

  /** Logs in and returns the `hcc_admin=…` cookie pair (unique IP: no login rate-limit interference). */
  const login = async (email: string, password: string): Promise<string> => {
    const res = await request(server)
      .post('/api/admin/auth/login')
      .set('X-Forwarded-For', `10.9.0.${++ipN}`)
      .send({ email, password })
      .expect(200);
    return cookieOf(res)!;
  };
  const cookieOf = (res: request.Response): string | undefined =>
    (res.headers['set-cookie'] as unknown as string[] | undefined)
      ?.find((c) => c.startsWith('hcc_admin='))
      ?.split(';')[0];
  const as = (cookie: string) => ({
    get: (p: string) => request(server).get(p).set('Cookie', cookie),
    post: (p: string, b: object) => request(server).post(p).set('Cookie', cookie).send(b),
    patch: (p: string, b: object) => request(server).patch(p).set('Cookie', cookie).send(b),
    del: (p: string) => request(server).delete(p).set('Cookie', cookie),
  });

  let superCookie: string;
  let superId: string;

  beforeEach(async () => {
    await admins.deleteMany({});
    await t.app.get(AdminSeedService).seed();
    superCookie = await login(SUPER, SUPER_PW);
    superId = (await as(superCookie).get('/api/admin/auth/me').expect(200)).body.id;
  });

  const createUser = async (email = 'dj@hec.ci', password = 'dj-password-1') =>
    (await as(superCookie).post('/api/admin/users', { email, password }).expect(201)).body as {
      id: string;
      email: string;
    };

  it('requires an admin session', async () => {
    await request(server).get('/api/admin/users').expect(401);
    await request(server)
      .post('/api/admin/users')
      .send({ email: 'a@b.co', password: '12345678' })
      .expect(401);
  });

  it('lists accounts: super admin first, flags isSuperAdmin / isMe, never exposes hashes', async () => {
    await createUser();
    const { body } = await as(superCookie).get('/api/admin/users').expect(200);
    expect(body).toHaveLength(2);
    expect(body[0]).toEqual({
      id: superId,
      email: SUPER,
      isSuperAdmin: true,
      isMe: true,
      createdAt: expect.any(String),
      lastLoginAt: expect.any(String),
    });
    expect(body[1]).toMatchObject({
      email: 'dj@hec.ci',
      isSuperAdmin: false,
      isMe: false,
      lastLoginAt: null,
    });
    expect(JSON.stringify(body)).not.toMatch(/passwordHash|sessionVersion|envPasswordHash/);
  });

  it('creates an account that can log in and manage users too (all accounts are admins)', async () => {
    const dj = await createUser(' DJ@Hec.CI ', 'dj-password-1');
    expect(dj.email).toBe('dj@hec.ci');
    const djCookie = await login('dj@hec.ci', 'dj-password-1');
    const me = await as(djCookie).get('/api/admin/auth/me').expect(200);
    expect(me.body).toEqual({ id: dj.id, email: 'dj@hec.ci', isSuperAdmin: false });
    await as(djCookie)
      .post('/api/admin/users', { email: 'bar@hec.ci', password: 'bar-password' })
      .expect(201);
    await as(djCookie).get('/api/admin/stats').expect(200);
  });

  it('validates input and rejects duplicate emails (409 EMAIL_TAKEN)', async () => {
    await createUser();
    const dup = await as(superCookie).post('/api/admin/users', {
      email: 'DJ@hec.ci',
      password: 'another-pw',
    });
    expect(dup.status).toBe(409);
    expect(dup.body).toEqual({
      statusCode: 409,
      code: 'EMAIL_TAKEN',
      message: 'Un compte existe déjà avec cet email.',
    });
    await as(superCookie).post('/api/admin/users', { email: 'nope', password: 'long-enough' }).expect(400);
    await as(superCookie).post('/api/admin/users', { email: 'x@hec.ci', password: 'short' }).expect(400);
  });

  it('any admin edits another regular account (email, password) and the old password stops working', async () => {
    const dj = await createUser();
    const other = await createUser('other@hec.ci', 'other-password');
    const otherCookie = await login('other@hec.ci', 'other-password');

    const res = await as(otherCookie)
      .patch(`/api/admin/users/${dj.id}`, { email: 'dj2@hec.ci', password: 'new-dj-password' })
      .expect(200);
    expect(res.body).toMatchObject({ id: dj.id, email: 'dj2@hec.ci' });
    expect(cookieOf(res)).toBeUndefined(); // not the actor's own password: no cookie re-issued
    await request(server)
      .post('/api/admin/auth/login')
      .set('X-Forwarded-For', '10.9.1.1')
      .send({ email: 'dj2@hec.ci', password: 'dj-password-1' })
      .expect(401);
    await login('dj2@hec.ci', 'new-dj-password');
    expect(other.id).toBeDefined();
  });

  it('a password change revokes that account’s open sessions', async () => {
    const dj = await createUser();
    const djCookie = await login('dj@hec.ci', 'dj-password-1');
    await as(superCookie).patch(`/api/admin/users/${dj.id}`, { password: 'rotated-password' }).expect(200);
    expect((await as(djCookie).get('/api/admin/auth/me').expect(401)).body.code).toBe('UNAUTHORIZED');
  });

  it('changing my own password keeps my session (fresh cookie) and revokes my other sessions', async () => {
    const dj = await createUser();
    const tab1 = await login('dj@hec.ci', 'dj-password-1');
    const tab2 = await login('dj@hec.ci', 'dj-password-1');
    const res = await as(tab1)
      .patch(`/api/admin/users/${dj.id}`, { password: 'my-new-password' })
      .expect(200);
    const fresh = cookieOf(res)!;
    expect(fresh).toBeDefined();
    await as(fresh).get('/api/admin/auth/me').expect(200);
    await as(tab1).get('/api/admin/auth/me').expect(401);
    await as(tab2).get('/api/admin/auth/me').expect(401);
  });

  it('changing my email keeps my session', async () => {
    const dj = await createUser();
    const djCookie = await login('dj@hec.ci', 'dj-password-1');
    await as(djCookie).patch(`/api/admin/users/${dj.id}`, { email: 'renamed@hec.ci' }).expect(200);
    expect((await as(djCookie).get('/api/admin/auth/me').expect(200)).body.email).toBe('renamed@hec.ci');
  });

  it('email change to an existing email -> 409', async () => {
    const dj = await createUser();
    await createUser('taken@hec.ci', 'taken-password');
    expect(
      (await as(superCookie).patch(`/api/admin/users/${dj.id}`, { email: 'taken@hec.ci' }).expect(409)).body
        .code,
    ).toBe('EMAIL_TAKEN');
    expect(
      (await as(superCookie).patch(`/api/admin/users/${dj.id}`, { email: SUPER }).expect(409)).body.code,
    ).toBe('EMAIL_TAKEN');
  });

  describe('super admin protection', () => {
    it('nobody else may change its password', async () => {
      await createUser();
      const djCookie = await login('dj@hec.ci', 'dj-password-1');
      const res = await as(djCookie)
        .patch(`/api/admin/users/${superId}`, { password: 'hijacked-pw' })
        .expect(403);
      expect(res.body.code).toBe('SUPER_ADMIN_PROTECTED');
      await login(SUPER, SUPER_PW);
    });

    it('it may change its own password, which then survives a restart (seed)', async () => {
      const res = await as(superCookie)
        .patch(`/api/admin/users/${superId}`, { password: 'super-new-pw' })
        .expect(200);
      expect(cookieOf(res)).toBeDefined();
      expect(await t.app.get(AdminSeedService).seed()).toBe('unchanged');
      await login(SUPER, 'super-new-pw');
    });

    it('its email cannot be changed, even by itself', async () => {
      const res = await as(superCookie)
        .patch(`/api/admin/users/${superId}`, { email: 'other@hec.ci' })
        .expect(403);
      expect(res.body.code).toBe('SUPER_ADMIN_PROTECTED');
    });

    it('it cannot be deleted (by anyone)', async () => {
      await createUser();
      const djCookie = await login('dj@hec.ci', 'dj-password-1');
      expect((await as(djCookie).del(`/api/admin/users/${superId}`).expect(403)).body.code).toBe(
        'SUPER_ADMIN_PROTECTED',
      );
      expect((await as(superCookie).del(`/api/admin/users/${superId}`).expect(403)).body.code).toBe(
        'SUPER_ADMIN_PROTECTED',
      );
    });

    it('the recovery script (force) resets its password from ADMIN_PASSWORD and revokes sessions', async () => {
      await as(superCookie).patch(`/api/admin/users/${superId}`, { password: 'forgotten-pw' }).expect(200);
      const cookie = await login(SUPER, 'forgotten-pw');
      expect(await t.app.get(AdminSeedService).seed({ force: true })).toBe('updated');
      await as(cookie).get('/api/admin/auth/me').expect(401);
      await login(SUPER, SUPER_PW);
    });
  });

  it('the startup seed never deletes other accounts', async () => {
    await createUser();
    await t.app.get(AdminSeedService).seed();
    expect(await admins.countDocuments()).toBe(2);
  });

  it('deletes a regular account; its sessions die; deleting myself clears my cookie', async () => {
    const dj = await createUser();
    const djCookie = await login('dj@hec.ci', 'dj-password-1');
    await as(superCookie).del(`/api/admin/users/${dj.id}`).expect(204);
    await as(djCookie).get('/api/admin/auth/me').expect(401);
    await as(superCookie).del(`/api/admin/users/${dj.id}`).expect(404);

    const me2 = await createUser('self@hec.ci', 'self-password');
    const selfCookie = await login('self@hec.ci', 'self-password');
    const res = await as(selfCookie).del(`/api/admin/users/${me2.id}`).expect(204);
    expect((res.headers['set-cookie'] as unknown as string[])[0]).toMatch(/hcc_admin=;/);
  });

  it('unknown or malformed ids -> 404', async () => {
    await as(superCookie).patch('/api/admin/users/not-an-id', { email: 'x@hec.ci' }).expect(404);
    await as(superCookie).del('/api/admin/users/65a000000000000000000000').expect(404);
  });
});
