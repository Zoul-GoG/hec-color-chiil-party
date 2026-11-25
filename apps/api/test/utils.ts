import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { getModelToken } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Model } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { Addition } from '../src/additions/addition.schema';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { DEEZER_FETCH } from '../src/deezer/deezer.types';
import { Track } from '../src/tracks/track.schema';
import { FakeDeezer } from './fake-deezer';

export interface TestApp {
  app: NestExpressApplication;
  deezer: FakeDeezer;
  trackModel: Model<Track>;
  additionModel: Model<Addition>;
  clearDb: () => Promise<void>;
  close: () => Promise<void>;
}

/** Boots the full app against a fresh in-memory MongoDB and a fixture-backed fake Deezer. */
export async function createTestApp(): Promise<TestApp> {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  const deezer = new FakeDeezer();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DEEZER_FETCH)
    .useValue(deezer.fetch)
    .compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: ['error', 'warn'] });
  configureApp(app);
  await app.init();
  const trackModel = app.get<Model<Track>>(getModelToken(Track.name));
  const additionModel = app.get<Model<Addition>>(getModelToken(Addition.name));
  await Promise.all([trackModel.syncIndexes(), additionModel.syncIndexes()]);
  return {
    app,
    deezer,
    trackModel,
    additionModel,
    clearDb: async () => {
      await Promise.all([trackModel.deleteMany({}), additionModel.deleteMany({})]);
    },
    close: async () => {
      await app.close();
      await mongo.stop();
    },
  };
}

export const newGuest = (): string => randomUUID();
