import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { AdminUserDto } from '@hcc/shared';
import type { Response } from 'express';
import { AUTH } from '../../config/constants';
import { cookieOptions } from '../auth/auth.controller';
import { AuthService } from '../auth/auth.service';
import { JwtCookieGuard, type AdminRequest } from '../auth/jwt-cookie.guard';
import { CreateAdminUserBodyDto, UpdateAdminUserBodyDto } from './users.dto';
import { UsersService } from './users.service';

@Controller('admin/users')
@UseGuards(JwtCookieGuard)
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  list(@Req() req: AdminRequest): Promise<AdminUserDto[]> {
    return this.users.list(req.admin!);
  }

  @Post()
  create(@Req() req: AdminRequest, @Body() body: CreateAdminUserBodyDto): Promise<AdminUserDto> {
    return this.users.create(req.admin!, body);
  }

  @Patch(':id')
  async update(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Body() body: UpdateAdminUserBodyDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AdminUserDto> {
    const actor = req.admin!;
    const { user, ownPasswordChanged, newVersion } = await this.users.update(actor, id, body);
    if (ownPasswordChanged) {
      // Other sessions are revoked; keep this one alive with a fresh cookie (same expiry).
      const maxAgeMs = Math.max(1000, actor.exp * 1000 - Date.now());
      const token = await this.auth.sign(actor.id, newVersion, maxAgeMs);
      res.cookie(AUTH.cookieName, token, cookieOptions(req, maxAgeMs));
    }
    return user;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Req() req: AdminRequest,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const { self } = await this.users.remove(req.admin!, id);
    if (self) res.clearCookie(AUTH.cookieName, cookieOptions(req));
  }
}
