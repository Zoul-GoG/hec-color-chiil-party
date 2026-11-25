import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdditionsModule } from './additions/additions.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './admin/auth/auth.module';
import { throttlerOptions } from './common/rate-limit';
import { validateEnv } from './config/env';
import { DatabaseModule } from './database/database.module';
import { ModelsModule } from './database/models.module';
import { DeezerModule } from './deezer/deezer.module';
import { HealthModule } from './health/health.module';
import { SettingsModule } from './settings/settings.module';
import { TracksModule } from './tracks/tracks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // cwd is the repo root in prod (`pnpm start`) and apps/api in dev.
      envFilePath: ['.env', '../../.env'],
      validate: (raw) => validateEnv(raw),
    }),
    ThrottlerModule.forRoot(throttlerOptions),
    DatabaseModule,
    ModelsModule,
    DeezerModule,
    HealthModule,
    TracksModule,
    AdditionsModule,
    AuthModule,
    AdminModule,
    SettingsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
