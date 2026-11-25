import { NestFactory } from '@nestjs/core';
import { AdminSeedService } from '../admin/auth/admin-seed.service';
import { AppModule } from '../app.module';

/** `pnpm --filter api seed:admin` — creates/updates the admin from ADMIN_EMAIL / ADMIN_PASSWORD. */
async function main(): Promise<void> {
  // The app bootstrap already runs the seed (onApplicationBootstrap).
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'warn', 'error'] });
  await app.get(AdminSeedService).seed();
  await app.close();
  // Exit explicitly: a local in-memory MongoDB child would otherwise keep the process alive.
  process.exit(0);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
