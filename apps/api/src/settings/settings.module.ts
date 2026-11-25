import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../admin/auth/auth.module';
import { SettingsController } from './settings.controller';
import { Settings, SettingsSchema } from './settings.schema';
import { SettingsService } from './settings.service';

@Global()
@Module({
  imports: [MongooseModule.forFeature([{ name: Settings.name, schema: SettingsSchema }]), AuthModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
