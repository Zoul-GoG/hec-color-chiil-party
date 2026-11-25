import { NestFactory } from '@nestjs/core';
import { AdminSeedService } from '../admin/auth/admin-seed.service';
import { AppModule } from '../app.module';

/**
 * `pnpm --filter api seed:admin` — recovery tool: (re)creates the super admin (ADMIN_EMAIL) and
 * FORCES its password back to ADMIN_PASSWORD (logs out its sessions). Other accounts are untouched.
 */
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'warn', 'error'] });
  // The bootstrap seed only applies ADMIN_PASSWORD when it changed; the script forces it.
  await app.get(AdminSeedService).seed({ force: true });
  await app.close();
  // Exit explicitly: a local in-memory MongoDB child would otherwise keep the process alive.
  process.exit(0);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
