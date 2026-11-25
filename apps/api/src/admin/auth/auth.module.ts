import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import type { Env } from '../../config/env';
import { AdminSeedService } from './admin-seed.service';
import { Admin, AdminSchema } from './admin.schema';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtCookieGuard } from './jwt-cookie.guard';
import { LoginAttemptsService } from './login-attempts.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Admin.name, schema: AdminSchema }]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AdminSeedService, LoginAttemptsService, JwtCookieGuard],
  exports: [AuthService, JwtCookieGuard, AdminSeedService],
})
export class AuthModule {}
