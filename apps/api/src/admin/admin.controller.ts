import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import type { AdminTrackDto, AdminTracksResponseDto, StatsDto } from '@hcc/shared';
import { JwtCookieGuard } from './auth/jwt-cookie.guard';
import { StatsService } from './stats/stats.service';
import { AdminTrackPatchBodyDto, AdminTracksQueryDto, RangeQueryDto } from './tracks/admin-tracks.dto';
import { AdminTracksService } from './tracks/admin-tracks.service';

@Controller('admin')
@UseGuards(JwtCookieGuard)
export class AdminController {
  constructor(
    private readonly stats: StatsService,
    private readonly tracks: AdminTracksService,
  ) {}

  @Get('stats')
  getStats(@Query() q: RangeQueryDto): Promise<StatsDto> {
    return this.stats.get(q.range);
  }

  @Get('tracks')
  list(@Query() q: AdminTracksQueryDto): Promise<AdminTracksResponseDto> {
    return this.tracks.list(q);
  }

  @Patch('tracks/:trackKey')
  patch(@Param('trackKey') trackKey: string, @Body() body: AdminTrackPatchBodyDto): Promise<AdminTrackDto> {
    return this.tracks.patch(trackKey, body);
  }
}
