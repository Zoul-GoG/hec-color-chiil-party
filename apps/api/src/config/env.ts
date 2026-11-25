import { z } from 'zod';
import { IS_PRODUCTION } from './constants';

/** The only 4 environment variables of the app (docs/08-DEPLOYMENT.md §1). */
const envSchema = z.object({
  MONGODB_URI: z.string().trim().min(1).optional(),
  ADMIN_EMAIL: z.email({ error: 'ADMIN_EMAIL doit être un email valide' }),
  ADMIN_PASSWORD: z.string().min(8, { error: 'ADMIN_PASSWORD doit faire au moins 8 caractères' }),
  JWT_SECRET: z.string().min(16, { error: 'JWT_SECRET doit faire au moins 16 caractères' }),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>, production = IS_PRODUCTION): Env {
  const input = {
    MONGODB_URI: raw.MONGODB_URI || undefined,
    ADMIN_EMAIL: raw.ADMIN_EMAIL,
    ADMIN_PASSWORD: raw.ADMIN_PASSWORD,
    JWT_SECRET: raw.JWT_SECRET,
  };
  const missing = (['ADMIN_EMAIL', 'ADMIN_PASSWORD', 'JWT_SECRET'] as const).filter((k) => !input[k]);
  if (production && !input.MONGODB_URI) missing.unshift('MONGODB_URI' as never);
  if (missing.length) {
    throw new Error(
      `Configuration invalide : variable(s) manquante(s) : ${missing.join(', ')} (voir .env.example).`,
    );
  }
  const result = envSchema.safeParse(input);
  if (!result.success) {
    throw new Error(`Configuration invalide (voir .env.example) :\n${z.prettifyError(result.error)}`);
  }
  if (production && !result.data.MONGODB_URI) {
    throw new Error('Configuration invalide : MONGODB_URI est obligatoire en production.');
  }
  return result.data;
}
