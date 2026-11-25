import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';

export interface TestApp {
  app: NestExpressApplication;
  close: () => Promise<void>;
}

/** Boots the full app against a fresh in-memory MongoDB. */
export async function createTestApp(): Promise<TestApp> {
  const mongo = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongo.getUri();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: ['error', 'warn'] });
  configureApp(app);
  await app.init();
  return {
    app,
    close: async () => {
      await app.close();
      await mongo.stop();
    },
  };
}
