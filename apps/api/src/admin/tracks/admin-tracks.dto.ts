import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import type { AdminSort, AdminStatus, ExplicitFilter, Range } from '@hcc/shared';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class RangeQueryDto {
  @IsOptional()
  @IsIn(['all', '1h'])
  range: Range = 'all';
}

export class AdminTracksQueryDto extends RangeQueryDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  q?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(80)
  genre?: string;

  @IsOptional()
  @IsIn(['all', 'toplay', 'played', 'hidden'])
  status: AdminStatus = 'all';

  @IsOptional()
  @IsIn(['include', 'exclude'])
  explicit: ExplicitFilter = 'include';

  @IsOptional()
  @IsIn(['count_desc', 'count_asc', 'recent', 'alpha'])
  sort: AdminSort = 'count_desc';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 50;
}

export class AdminTrackPatchBodyDto {
  @IsOptional()
  @IsBoolean()
  played?: boolean;

  @IsOptional()
  @IsBoolean()
  hidden?: boolean;
}
