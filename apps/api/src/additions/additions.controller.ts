import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import type { AddTrackResponseDto } from '@hcc/shared';
import type { Request, Response } from 'express';
import { GuestId } from '../common/guest-id.decorator';
import { RateLimit } from '../common/rate-limit';
import { AddTrackBodyDto } from '../tracks/tracks.dto';
import { AdditionsService } from './additions.service';

@Controller('additions')
export class AdditionsController {
  constructor(private readonly additions: AdditionsService) {}

  @Post()
  @RateLimit('addIp')
  async add(
    @GuestId() guestId: string,
    @Body() body: AddTrackBodyDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AddTrackResponseDto> {
    const { status, ...payload } = await this.additions.add(body.deezerId, guestId, req.ip);
    res.status(status);
    return payload;
  }
}
