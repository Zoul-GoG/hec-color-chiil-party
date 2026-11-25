import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { HealthDto } from '@hcc/shared';
import type { Response } from 'express';
import type { Connection } from 'mongoose';

@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  check(@Res({ passthrough: true }) res: Response): HealthDto {
    const up = this.connection.readyState === 1;
    if (!up) res.status(HttpStatus.SERVICE_UNAVAILABLE);
    return { status: up ? 'ok' : 'degraded', db: up ? 'up' : 'down' };
  }
}
