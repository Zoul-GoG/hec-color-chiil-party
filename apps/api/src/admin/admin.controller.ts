import { Body, Controller, Get, Header, Param, Patch, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
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

  // Declared before `tracks/:trackKey`-style routes; GET has none, but keep it first for clarity.
  @Get('tracks/export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  async exportCsv(
    @Query() q: AdminTracksQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
    res.setHeader('Content-Disposition', `attachment; filename="color-chill-classement-${stamp}.csv"`);
    return this.tracks.exportCsv(q);
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
