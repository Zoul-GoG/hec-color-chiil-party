import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcryptjs';
import type { Model } from 'mongoose';
import { AUTH } from '../../config/constants';
import type { Env } from '../../config/env';
import { Admin } from './admin.schema';

export type SeedResult = 'created' | 'updated' | 'unchanged';

/**
 * Ensures the super admin (ADMIN_EMAIL) exists. Other accounts are never touched.
 * Its password is (re)set from ADMIN_PASSWORD only when the account is created, when ADMIN_PASSWORD
 * changed since it was last applied, or with `force` (recovery script) — so a password changed
 * from the UI survives restarts.
 */
@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger('AdminSeed');

  constructor(
    @InjectModel(Admin.name) private readonly admins: Model<Admin>,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seed();
  }

  async seed({ force = false }: { force?: boolean } = {}): Promise<SeedResult> {
    const email = this.config.get('ADMIN_EMAIL', { infer: true }).trim().toLowerCase();
    const password = this.config.get('ADMIN_PASSWORD', { infer: true });
    const existing = await this.admins.findOne({ email });

    if (existing && !force && existing.envPasswordHash) {
      if (await bcrypt.compare(password, existing.envPasswordHash)) return 'unchanged';
    }
    // Legacy account (seeded before envPasswordHash existed) whose password still matches: just record it.
    if (
      existing &&
      !force &&
      !existing.envPasswordHash &&
      (await bcrypt.compare(password, existing.passwordHash))
    ) {
      await this.admins.updateOne(
        { _id: existing._id },
        { $set: { envPasswordHash: existing.passwordHash } },
      );
      return 'unchanged';
    }

    const hash = await bcrypt.hash(password, AUTH.bcryptCost);
    if (existing) {
      await this.admins.updateOne(
        { _id: existing._id },
        { $set: { passwordHash: hash, envPasswordHash: hash }, $inc: { sessionVersion: 1 } },
      );
      this.logger.log(`Mot de passe du super admin réinitialisé depuis ADMIN_PASSWORD (${email}).`);
      return 'updated';
    }
    await this.admins.create({ email, passwordHash: hash, envPasswordHash: hash });
    this.logger.log(`Super admin créé (${email}).`);
    return 'created';
  }
}
