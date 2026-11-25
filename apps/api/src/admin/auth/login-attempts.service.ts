import { Injectable } from '@nestjs/common';
import { LRUCache } from 'lru-cache';
import { THROTTLE } from '../../config/constants';

/** Counts FAILED logins per IP (5 / 15 min, docs/01 US-6). Successful logins don't count. */
@Injectable()
export class LoginAttemptsService {
  private readonly failures = new LRUCache<string, number>({
    max: 10_000,
    ttl: THROTTLE.loginPerIp.ttlMs,
    ttlAutopurge: false,
  });

  isBlocked(ip: string): boolean {
    return (this.failures.get(ip) ?? 0) >= THROTTLE.loginPerIp.limit;
  }

  recordFailure(ip: string): void {
    // noUpdateTTL keeps the window anchored on the first failure.
    this.failures.set(ip, (this.failures.get(ip) ?? 0) + 1, { noUpdateTTL: this.failures.has(ip) });
  }

  reset(ip: string): void {
    this.failures.delete(ip);
  }
}
