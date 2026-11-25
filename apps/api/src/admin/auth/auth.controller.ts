import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AdminMeDto } from '@hcc/shared';
import type { CookieOptions, Request, Response } from 'express';
import { hashIp } from '../../common/utils';
import { AUTH, IS_PRODUCTION } from '../../config/constants';
import type { Env } from '../../config/env';
import { LoginBodyDto } from './auth.dto';
import { AuthService } from './auth.service';
import { JwtCookieGuard, type AdminRequest } from './jwt-cookie.guard';

function cookieOptions(req: Request, maxAgeMs?: number): CookieOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PRODUCTION || req.secure,
    path: '/api',
    ...(maxAgeMs ? { maxAge: maxAgeMs } : {}),
  };
}

@Controller('admin/auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: LoginBodyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AdminMeDto> {
    const ipKey = hashIp(req.ip, this.config.get('JWT_SECRET', { infer: true }));
    const { email, token, maxAgeMs } = await this.auth.login(body.email, body.password, body.remember, ipKey);
    res.cookie(AUTH.cookieName, token, cookieOptions(req, maxAgeMs));
    return { email };
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): void {
    res.clearCookie(AUTH.cookieName, cookieOptions(req));
  }

  @Get('me')
  @UseGuards(JwtCookieGuard)
  me(@Req() req: AdminRequest): AdminMeDto {
    return { email: req.admin!.email };
  }
}
