import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { Model } from 'mongoose';
import type { Addition } from '../additions/addition.schema';
import { AppModule } from '../app.module';
import type { Track } from '../tracks/track.schema';
import { modelTokens, recount, resetData } from './maintenance';

/**
 * pnpm --filter api recount            -> recompute addCount from additions
 * pnpm --filter api reset-data --yes   -> wipe tracks + additions (before the party)
 */
async function main(): Promise<void> {
  const [command, ...flags] = process.argv.slice(2);
  const logger = new Logger('Maintenance');
  if (command === 'reset-data' && !flags.includes('--yes')) {
    logger.error('Refusé : ajoute --yes pour confirmer la suppression de tous les morceaux et ajouts.');
    process.exit(1);
  }
  if (command !== 'recount' && command !== 'reset-data') {
    logger.error('Usage : recount | reset-data --yes');
    process.exit(1);
  }
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'warn', 'error'] });
  const tracks = app.get<Model<Track>>(modelTokens.track);
  const additions = app.get<Model<Addition>>(modelTokens.addition);
  if (command === 'recount') {
    logger.log(`Recount terminé : ${await recount(tracks, additions)} morceau(x) corrigé(s).`);
  } else {
    const r = await resetData(tracks, additions);
    logger.log(`Données vidées : ${r.tracks} morceaux, ${r.additions} ajouts supprimés.`);
  }
  await app.close();
  // Exit explicitly: a local in-memory MongoDB child would otherwise keep the process alive.
  process.exit(0);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
