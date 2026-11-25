import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ErrorCode, type PublicSettingsDto } from '@hcc/shared';
import type { Model } from 'mongoose';
import { AppException } from '../common/app.exception';
import { EVENT } from '../config/constants';
import { Settings } from './settings.schema';

const ID = 'global';

/** US-11: open/close submissions. */
@Injectable()
export class SettingsService {
  constructor(@InjectModel(Settings.name) private readonly settings: Model<Settings>) {}

  async submissionsOpen(): Promise<boolean> {
    const doc = await this.settings.findById(ID).lean();
    return doc?.submissionsOpen ?? true;
  }

  async assertOpen(): Promise<void> {
    if (!(await this.submissionsOpen())) throw new AppException(ErrorCode.SUBMISSIONS_CLOSED);
  }

  async setSubmissionsOpen(open: boolean): Promise<{ submissionsOpen: boolean }> {
    await this.settings.updateOne({ _id: ID }, { $set: { submissionsOpen: open } }, { upsert: true });
    return { submissionsOpen: open };
  }

  async publicSettings(): Promise<PublicSettingsDto> {
    return { submissionsOpen: await this.submissionsOpen(), eventName: EVENT.name, eventDate: EVENT.date };
  }
}
