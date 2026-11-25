import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // cwd is the repo root in prod (`pnpm start`) and apps/api in dev.
      envFilePath: ['.env', '../../.env'],
      validate: (raw) => validateEnv(raw),
    }),
    DatabaseModule,
    HealthModule,
  ],
})
export class AppModule {}
