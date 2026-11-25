import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

/** One document per playlist track (docs/04-DATA-MODEL.md §1). */
@Schema({ collection: 'tracks', timestamps: true })
export class Track {
  @Prop({ required: true }) trackKey: string;
  @Prop({ type: String, default: null }) isrc: string | null;
  @Prop({ required: true }) deezerId: number;
  @Prop({ type: [Number], default: [] }) deezerIds: number[];
  @Prop({ required: true }) title: string;
  @Prop({ required: true }) artistName: string;
  @Prop({ default: '' }) albumTitle: string;
  @Prop({ default: 0 }) albumId: number;
  @Prop({ default: '' }) coverSmall: string;
  @Prop({ default: '' }) coverMedium: string;
  @Prop({ default: 0 }) duration: number;
  @Prop({ default: false }) explicit: boolean;
  @Prop({ default: '' }) deezerLink: string;
  @Prop({ type: String, default: null }) previewUrl: string | null;
  @Prop({ type: Date, default: null }) previewExpiresAt: Date | null;
  @Prop({ type: String, default: null }) genre: string | null;
  @Prop({ default: 0 }) addCount: number;
  @Prop({ required: true }) firstAddedAt: Date;
  @Prop({ required: true }) lastAddedAt: Date;
  @Prop({ default: false }) hidden: boolean;
  @Prop({ default: false }) played: boolean;
  @Prop({ type: Date, default: null }) playedAt: Date | null;
}

export type TrackDocument = HydratedDocument<Track>;
export const TrackSchema = SchemaFactory.createForClass(Track);
TrackSchema.index({ trackKey: 1 }, { unique: true });
TrackSchema.index({ deezerIds: 1 });
TrackSchema.index({ hidden: 1, addCount: -1, lastAddedAt: -1 });
TrackSchema.index({ hidden: 1, firstAddedAt: -1 });
TrackSchema.index({ genre: 1 });
