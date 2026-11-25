import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

/** Single document `_id: "global"` (docs/04 §4). */
@Schema({ collection: 'settings', timestamps: true })
export class Settings {
  @Prop({ type: String }) _id: string;
  @Prop({ default: true }) submissionsOpen: boolean;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
