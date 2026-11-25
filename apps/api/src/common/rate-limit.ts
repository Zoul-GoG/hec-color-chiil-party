import { SetMetadata, type ExecutionContext } from '@nestjs/common';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import type { Request } from 'express';
import { THROTTLE } from '../config/constants';
import { readGuestId } from './guest-id.decorator';

/** Named route-specific limits (docs/02-ARCHITECTURE.md §6). `global` applies everywhere. */
/** Login failures are counted separately (LoginAttemptsService): only FAILED attempts count. */
export type RateLimitName = 'search' | 'addIp';

const RATE_LIMIT_KEY = 'hcc:rate-limits';

/** Opts a handler into named throttlers: `@RateLimit('search')`. */
export const RateLimit = (...names: RateLimitName[]) => SetMetadata(RATE_LIMIT_KEY, names);

const onlyFor =
  (name: RateLimitName) =>
  (ctx: ExecutionContext): boolean => {
    const names = Reflect.getMetadata(RATE_LIMIT_KEY, ctx.getHandler()) as RateLimitName[] | undefined;
    return !names?.includes(name);
  };

const byIp = (req: Record<string, unknown>) => `ip:${(req as unknown as Request).ip ?? 'unknown'}`;
const byGuestOrIp = (req: Record<string, unknown>) => {
  const guestId = readGuestId(req as unknown as Request);
  return guestId ? `guest:${guestId}` : byIp(req);
};

export const throttlerOptions: ThrottlerModuleOptions = {
  errorMessage: 'RATE_LIMITED',
  throttlers: [
    { name: 'global', ttl: 60_000, limit: THROTTLE.globalPerMinute, getTracker: byIp },
    {
      name: 'search',
      ttl: 60_000,
      limit: THROTTLE.searchPerMinute,
      getTracker: byGuestOrIp,
      skipIf: onlyFor('search'),
    },
    {
      name: 'addIp',
      ttl: THROTTLE.additionsPerIp.ttlMs,
      limit: THROTTLE.additionsPerIp.limit,
      getTracker: byIp,
      skipIf: onlyFor('addIp'),
    },
  ],
};
