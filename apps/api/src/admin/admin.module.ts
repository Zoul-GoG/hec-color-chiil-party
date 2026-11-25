import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AuthModule } from './auth/auth.module';
import { StatsService } from './stats/stats.service';
import { AdminTracksService } from './tracks/admin-tracks.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminController],
  providers: [StatsService, AdminTracksService],
})
export class AdminModule {}
