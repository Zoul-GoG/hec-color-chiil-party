import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import bcrypt from 'bcryptjs';
import type { Model } from 'mongoose';
import { AUTH } from '../../config/constants';
import type { Env } from '../../config/env';
import { Admin } from './admin.schema';

/** Creates/updates the admin from env at startup; the hash is rewritten only if the password changed. */
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

  async seed(): Promise<'created' | 'updated' | 'unchanged'> {
    const email = this.config.get('ADMIN_EMAIL', { infer: true }).trim().toLowerCase();
    const password = this.config.get('ADMIN_PASSWORD', { infer: true });
    const existing = await this.admins.findOne({ email });
    if (existing && (await bcrypt.compare(password, existing.passwordHash))) return 'unchanged';
    const passwordHash = await bcrypt.hash(password, AUTH.bcryptCost);
    await this.admins.updateOne({ email }, { $set: { passwordHash } }, { upsert: true });
    // A single account: drop any admin whose email no longer matches ADMIN_EMAIL.
    await this.admins.deleteMany({ email: { $ne: email } });
    const result = existing ? 'updated' : 'created';
    this.logger.log(`Compte admin ${result === 'created' ? 'créé' : 'mis à jour'} (${email}).`);
    return result;
  }
}
