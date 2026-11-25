import request from 'supertest';
import { recount, resetData } from '../src/scripts/maintenance';
import { createTestApp, newGuest, type TestApp } from './utils';

describe('Maintenance scripts (e2e)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.close();
  });

  it('recount repairs drifted counters', async () => {
    const server = t.app.getHttpServer();
    for (let i = 0; i < 3; i++) {
      await request(server)
        .post('/api/additions')
        .set('X-Guest-Id', newGuest())
        .send({ deezerId: 745229932 })
        .expect(201);
    }
    await t.trackModel.updateOne({}, { $set: { addCount: 99 } });
    expect(await recount(t.trackModel, t.additionModel)).toBe(1);
    expect((await t.trackModel.findOne().lean())?.addCount).toBe(3);
    expect(await recount(t.trackModel, t.additionModel)).toBe(0);
  });

  it('reset-data empties tracks and additions', async () => {
    expect(await resetData(t.trackModel, t.additionModel)).toEqual({ tracks: 1, additions: 3 });
    expect(await t.trackModel.countDocuments()).toBe(0);
  });
});
