import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { ErrorCode } from '@hcc/shared';
import bcrypt from 'bcryptjs';
import type { Model } from 'mongoose';
import { isValidObjectId } from 'mongoose';
import { AppException } from '../../common/app.exception';
import { AUTH } from '../../config/constants';
import type { Env } from '../../config/env';
import { Admin } from './admin.schema';
import { LoginAttemptsService } from './login-attempts.service';

/** Signed in the `hcc_admin` cookie. `ver` must match the account's sessionVersion. */
export interface AdminJwtPayload {
  sub: string;
  ver: number;
  exp?: number;
}

/** The authenticated admin, as resolved from the database on every admin request. */
export interface AdminSession {
  id: string;
  email: string;
  isSuperAdmin: boolean;
  ver: number;
  /** Token expiry (epoch seconds), used to re-issue the cookie with the same lifetime. */
  exp: number;
}

// Compared when the email is unknown, so timing does not reveal whether the account exists.
const DUMMY_HASH = bcrypt.hashSync('not-the-password', 4);

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Admin.name) private readonly admins: Model<Admin>,
    private readonly jwt: JwtService,
    private readonly attempts: LoginAttemptsService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  superAdminEmail(): string {
    return this.config.get('ADMIN_EMAIL', { infer: true }).trim().toLowerCase();
  }

  async login(
    email: string,
    password: string,
    remember: boolean,
    ipKey: string,
  ): Promise<{ session: AdminSession; token: string; maxAgeMs: number }> {
    if (this.attempts.isBlocked(ipKey)) throw new AppException(ErrorCode.RATE_LIMITED);
    const admin = await this.admins.findOne({ email: email.trim().toLowerCase() });
    const ok = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
    if (!admin || !ok) {
      this.attempts.recordFailure(ipKey);
      throw new AppException(ErrorCode.INVALID_CREDENTIALS);
    }
    this.attempts.reset(ipKey);
    await this.admins.updateOne({ _id: admin._id }, { $set: { lastLoginAt: new Date() } });
    const maxAgeMs = remember ? AUTH.rememberMs : AUTH.sessionMs;
    const ver = admin.sessionVersion ?? 0;
    const token = await this.sign(admin._id.toString(), ver, maxAgeMs);
    const session: AdminSession = {
      id: admin._id.toString(),
      email: admin.email,
      isSuperAdmin: admin.email === this.superAdminEmail(),
      ver,
      exp: Math.floor((Date.now() + maxAgeMs) / 1000),
    };
    return { session, token, maxAgeMs };
  }

  sign(id: string, ver: number, maxAgeMs: number): Promise<string> {
    const payload: AdminJwtPayload = { sub: id, ver };
    return this.jwt.signAsync(payload, { expiresIn: Math.max(1, Math.floor(maxAgeMs / 1000)) });
  }

  /** Verifies a session token against the database (account exists, sessions not revoked). */
  async verify(token: string | undefined): Promise<AdminSession | null> {
    if (!token) return null;
    try {
      const payload = await this.jwt.verifyAsync<AdminJwtPayload>(token);
      if (!isValidObjectId(payload.sub)) return null;
      const admin = await this.admins.findById(payload.sub).lean();
      if (!admin || (admin.sessionVersion ?? 0) !== (payload.ver ?? 0)) return null;
      return {
        id: admin._id.toString(),
        email: admin.email,
        isSuperAdmin: admin.email === this.superAdminEmail(),
        ver: admin.sessionVersion ?? 0,
        exp: payload.exp ?? 0,
      };
    } catch {
      return null;
    }
  }
}
