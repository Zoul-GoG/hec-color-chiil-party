import { Controller, Get, Param, Query } from '@nestjs/common';
import type { Paginated, PreviewDto, SearchResponseDto, TrackDto } from '@hcc/shared';
import { GuestId } from '../common/guest-id.decorator';
import { RateLimit } from '../common/rate-limit';
import { ListTracksQueryDto, PreviewQueryDto, SearchQueryDto } from './tracks.dto';
import { TracksService } from './tracks.service';

@Controller()
export class TracksController {
  constructor(private readonly tracks: TracksService) {}

  @Get('search')
  @RateLimit('search')
  async search(
    @Query() query: SearchQueryDto,
    @GuestId({ optional: true }) guestId: string | null,
  ): Promise<SearchResponseDto> {
    return { items: await this.tracks.search(query.q, query.limit, guestId) };
  }

  @Get('tracks')
  list(
    @Query() query: ListTracksQueryDto,
    @GuestId({ optional: true }) guestId: string | null,
  ): Promise<Paginated<TrackDto>> {
    return this.tracks.list(query.sort, query.page, query.limit, guestId);
  }

  @Get('tracks/:trackKey/preview')
  @RateLimit('search')
  preview(@Param('trackKey') trackKey: string, @Query() query: PreviewQueryDto): Promise<PreviewDto> {
    return this.tracks.preview(trackKey, query.deezerId);
  }
}
