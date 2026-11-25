import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DEFAULT_DB_NAME } from '../config/constants';
import type { Env } from '../config/env';

/** True when the URI path names a database (`mongodb+srv://host/mydb`). */
export function uriHasDbName(uri: string): boolean {
  const withoutQuery = uri.split('?')[0];
  const afterHosts = withoutQuery.replace(/^mongodb(\+srv)?:\/\/[^/]*/, '');
  return afterHosts.replace(/^\//, '').length > 0;
}

/** Local dev without MONGODB_URI: ephemeral in-memory MongoDB (docs/08-DEPLOYMENT.md §1). */
async function startInMemoryMongo(): Promise<string> {
  const logger = new Logger('Database');
  logger.warn('MONGODB_URI absente : démarrage sur mongodb-memory-server (données NON persistées).');
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const server = await MongoMemoryServer.create();
  return server.getUri();
}

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService<Env, true>) => {
        const uri = config.get('MONGODB_URI', { infer: true }) ?? (await startInMemoryMongo());
        return {
          uri,
          dbName: uriHasDbName(uri) ? undefined : DEFAULT_DB_NAME,
          serverSelectionTimeoutMS: 10_000,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
