import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { ErrorCode } from '@hcc/shared';
import bcrypt from 'bcryptjs';
import type { Model } from 'mongoose';
import { AppException } from '../../common/app.exception';
import { AUTH } from '../../config/constants';
import { Admin } from './admin.schema';
import { LoginAttemptsService } from './login-attempts.service';

export interface AdminJwtPayload {
  sub: string;
  email: string;
}

// Compared when the email is unknown, so timing does not reveal whether the account exists.
const DUMMY_HASH = bcrypt.hashSync('not-the-password', 4);

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Admin.name) private readonly admins: Model<Admin>,
    private readonly jwt: JwtService,
    private readonly attempts: LoginAttemptsService,
  ) {}

  async login(
    email: string,
    password: string,
    remember: boolean,
    ipKey: string,
  ): Promise<{ email: string; token: string; maxAgeMs: number }> {
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
    const payload: AdminJwtPayload = { sub: admin._id.toString(), email: admin.email };
    const token = await this.jwt.signAsync(payload, { expiresIn: Math.floor(maxAgeMs / 1000) });
    return { email: admin.email, token, maxAgeMs };
  }

  /** Verifies a session token and that the admin still exists. */
  async verify(token: string | undefined): Promise<AdminJwtPayload | null> {
    if (!token) return null;
    try {
      const payload = await this.jwt.verifyAsync<AdminJwtPayload>(token);
      const exists = await this.admins.exists({ _id: payload.sub, email: payload.email });
      return exists ? payload : null;
    } catch {
      return null;
    }
  }
}
