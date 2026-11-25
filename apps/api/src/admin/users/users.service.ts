import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ErrorCode, type AdminUserDto } from '@hcc/shared';
import bcrypt from 'bcryptjs';
import { isValidObjectId, type Model } from 'mongoose';
import { AppException } from '../../common/app.exception';
import { isDuplicateKeyError } from '../../common/utils';
import { AUTH } from '../../config/constants';
import { Admin } from '../auth/admin.schema';
import { AuthService, type AdminSession } from '../auth/auth.service';
import type { CreateAdminUserBodyDto, UpdateAdminUserBodyDto } from './users.dto';

type AdminRow = Admin & { _id: { toString(): string }; createdAt?: Date };

/**
 * User management. Every account is a full admin. The super admin (ADMIN_EMAIL) is protected:
 * its email is fixed by the server config, only itself may change its password, nobody may delete it.
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(Admin.name) private readonly admins: Model<Admin>,
    private readonly auth: AuthService,
  ) {}

  async list(actor: AdminSession): Promise<AdminUserDto[]> {
    const rows = await this.admins.find().sort({ createdAt: 1, _id: 1 }).lean<AdminRow[]>();
    const dtos = rows.map((r) => this.toDto(r, actor));
    // Super admin first, then by creation date.
    return dtos.sort((a, b) => Number(b.isSuperAdmin) - Number(a.isSuperAdmin));
  }

  async create(actor: AdminSession, body: CreateAdminUserBodyDto): Promise<AdminUserDto> {
    const passwordHash = await bcrypt.hash(body.password, AUTH.bcryptCost);
    try {
      const doc = await this.admins.create({ email: body.email, passwordHash });
      return this.toDto(doc.toObject() as AdminRow, actor);
    } catch (e) {
      if (isDuplicateKeyError(e)) throw new AppException(ErrorCode.EMAIL_TAKEN);
      throw e;
    }
  }

  /** Returns the updated account and whether the actor changed its own password (cookie to re-issue). */
  async update(
    actor: AdminSession,
    id: string,
    body: UpdateAdminUserBodyDto,
  ): Promise<{ user: AdminUserDto; ownPasswordChanged: boolean; newVersion: number }> {
    const target = await this.find(id);
    const targetIsSuper = target.email === this.auth.superAdminEmail();
    const isSelf = target._id.toString() === actor.id;

    const $set: Partial<Admin> = {};
    const $inc: Record<string, number> = {};
    if (body.email !== undefined && body.email !== target.email) {
      if (targetIsSuper) throw new AppException(ErrorCode.SUPER_ADMIN_PROTECTED);
      if (body.email === this.auth.superAdminEmail()) throw new AppException(ErrorCode.EMAIL_TAKEN);
      $set.email = body.email;
    }
    if (body.password !== undefined) {
      if (targetIsSuper && !isSelf) throw new AppException(ErrorCode.SUPER_ADMIN_PROTECTED);
      $set.passwordHash = await bcrypt.hash(body.password, AUTH.bcryptCost);
      // Revokes every open session of this account (the actor's own cookie is re-issued).
      $inc.sessionVersion = 1;
    }
    if (Object.keys($set).length === 0)
      return {
        user: this.toDto(target, actor),
        ownPasswordChanged: false,
        newVersion: target.sessionVersion ?? 0,
      };

    try {
      const updated = await this.admins
        .findByIdAndUpdate(target._id, { $set, ...(Object.keys($inc).length ? { $inc } : {}) }, { new: true })
        .lean<AdminRow>();
      if (!updated) throw new AppException(ErrorCode.NOT_FOUND);
      return {
        user: this.toDto(updated, actor),
        ownPasswordChanged: isSelf && body.password !== undefined,
        newVersion: updated.sessionVersion ?? 0,
      };
    } catch (e) {
      if (isDuplicateKeyError(e)) throw new AppException(ErrorCode.EMAIL_TAKEN);
      throw e;
    }
  }

  /** Deletes an account (its sessions die with it). Returns true when the actor deleted itself. */
  async remove(actor: AdminSession, id: string): Promise<{ self: boolean }> {
    const target = await this.find(id);
    if (target.email === this.auth.superAdminEmail()) throw new AppException(ErrorCode.SUPER_ADMIN_PROTECTED);
    await this.admins.deleteOne({ _id: target._id });
    return { self: target._id.toString() === actor.id };
  }

  private async find(id: string): Promise<AdminRow> {
    const doc = isValidObjectId(id) ? await this.admins.findById(id).lean<AdminRow>() : null;
    if (!doc) throw new AppException(ErrorCode.NOT_FOUND);
    return doc;
  }

  private toDto(r: AdminRow, actor: AdminSession): AdminUserDto {
    return {
      id: r._id.toString(),
      email: r.email,
      isSuperAdmin: r.email === this.auth.superAdminEmail(),
      isMe: r._id.toString() === actor.id,
      createdAt: (r.createdAt ?? new Date(0)).toISOString(),
      lastLoginAt: r.lastLoginAt ? new Date(r.lastLoginAt).toISOString() : null,
    };
  }
}
