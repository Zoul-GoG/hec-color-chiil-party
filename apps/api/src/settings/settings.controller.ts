import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import type { PublicSettingsDto } from '@hcc/shared';
import { IsBoolean } from 'class-validator';
import { JwtCookieGuard } from '../admin/auth/jwt-cookie.guard';
import { SettingsService } from './settings.service';

class SettingsPatchDto {
  @IsBoolean()
  submissionsOpen: boolean;
}

@Controller()
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get('settings/public')
  get(): Promise<PublicSettingsDto> {
    return this.settings.publicSettings();
  }

  @Patch('admin/settings')
  @UseGuards(JwtCookieGuard)
  patch(@Body() body: SettingsPatchDto): Promise<{ submissionsOpen: boolean }> {
    return this.settings.setSubmissionsOpen(body.submissionsOpen);
  }
}
