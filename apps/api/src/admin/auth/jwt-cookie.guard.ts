import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ErrorCode } from '@hcc/shared';
import type { Request } from 'express';
import { AppException } from '../../common/app.exception';
import { AUTH } from '../../config/constants';
import { AuthService, type AdminJwtPayload } from './auth.service';

export type AdminRequest = Request & { admin?: AdminJwtPayload };

/** Protects /api/admin/* (except login/logout) with the httpOnly `hcc_admin` cookie. */
@Injectable()
export class JwtCookieGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<AdminRequest>();
    const token = (req.cookies as Record<string, string> | undefined)?.[AUTH.cookieName];
    const admin = await this.auth.verify(token);
    if (!admin) throw new AppException(ErrorCode.UNAUTHORIZED);
    req.admin = admin;
    return true;
  }
}
