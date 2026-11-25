import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

/**
 * BDE admin account. All accounts are equal admins; the one whose email is ADMIN_EMAIL is the
 * super admin, (re)created at startup (AdminSeedService).
 */
@Schema({ collection: 'admins', timestamps: true })
export class Admin {
  @Prop({ required: true, unique: true, lowercase: true, trim: true }) email: string;
  @Prop({ required: true }) passwordHash: string;
  @Prop({ type: Date, default: null }) lastLoginAt: Date | null;
  /** Bumped on password change / to revoke sessions: tokens carry it and must match. */
  @Prop({ default: 0 }) sessionVersion: number;
  /** Super admin only: bcrypt of the ADMIN_PASSWORD last applied, to detect a config change. */
  @Prop({ type: String, default: null }) envPasswordHash: string | null;
  createdAt?: Date;
}

export type AdminDocument = HydratedDocument<Admin>;
export const AdminSchema = SchemaFactory.createForClass(Admin);
