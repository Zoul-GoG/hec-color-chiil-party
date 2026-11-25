import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { ErrorCode } from '@hcc/shared';
import type { Request } from 'express';
import { AppException } from './app.exception';

export const GUEST_HEADER = 'x-guest-id';
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Valid lowercase UUID v4 from `X-Guest-Id`, or null. */
export function readGuestId(req: Request): string | null {
  const raw = req.headers[GUEST_HEADER];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && UUID_V4.test(value.trim()) ? value.trim().toLowerCase() : null;
}

/**
 * `@GuestId()` → required (400 INVALID_GUEST_ID), `@GuestId({ optional: true })` → string | null.
 */
export const GuestId = createParamDecorator(
  (opts: { optional?: boolean } | undefined, ctx: ExecutionContext) => {
    const guestId = readGuestId(ctx.switchToHttp().getRequest<Request>());
    if (!guestId && !opts?.optional) throw new AppException(ErrorCode.INVALID_GUEST_ID);
    return guestId;
  },
);
