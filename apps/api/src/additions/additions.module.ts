import { Module } from '@nestjs/common';
import { AdditionsController } from './additions.controller';
import { AdditionsService } from './additions.service';

@Module({ controllers: [AdditionsController], providers: [AdditionsService] })
export class AdditionsModule {}
