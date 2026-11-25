import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsPositive, IsString, Length, Max, Min } from 'class-validator';
import type { PublicSort } from '@hcc/shared';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class SearchQueryDto {
  @Transform(trim)
  @IsString()
  @Length(3, 80)
  q: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit: number = 8;
}

export class ListTracksQueryDto {
  @IsOptional()
  @IsIn(['popular', 'recent'])
  sort: PublicSort = 'popular';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 24;
}

export class PreviewQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  deezerId?: number;
}

export class AddTrackBodyDto {
  @IsInt()
  @IsPositive()
  deezerId: number;
}
