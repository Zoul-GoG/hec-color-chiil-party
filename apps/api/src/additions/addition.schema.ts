import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

/** One document per (guest, track) — R2 (docs/04-DATA-MODEL.md §2). */
@Schema({ collection: 'additions', timestamps: true })
export class Addition {
  @Prop({ required: true }) trackKey: string;
  @Prop({ required: true }) deezerId: number;
  @Prop({ required: true }) guestId: string;
  @Prop({ default: '' }) ipHash: string;
  createdAt: Date;
}

export type AdditionDocument = HydratedDocument<Addition>;
export const AdditionSchema = SchemaFactory.createForClass(Addition);
AdditionSchema.index({ trackKey: 1, guestId: 1 }, { unique: true });
AdditionSchema.index({ createdAt: -1 });
AdditionSchema.index({ guestId: 1 });
