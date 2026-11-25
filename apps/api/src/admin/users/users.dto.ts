import { ADMIN_PASSWORD_MIN } from '@hcc/shared';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class CreateAdminUserBodyDto {
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(ADMIN_PASSWORD_MIN)
  @MaxLength(200)
  password: string;
}

export class UpdateAdminUserBodyDto {
  @IsOptional()
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(ADMIN_PASSWORD_MIN)
  @MaxLength(200)
  password?: string;
}
