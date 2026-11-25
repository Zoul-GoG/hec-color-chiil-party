import { createHash } from 'node:crypto';

/** Escapes a user string for use inside a RegExp. */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** IPs are never stored in clear: sha256(ip + secret), 16 hex chars. */
export function hashIp(ip: string | undefined, secret: string): string {
  return createHash('sha256')
    .update(`${ip ?? ''}${secret}`)
    .digest('hex')
    .slice(0, 16);
}

export function isDuplicateKeyError(e: unknown): boolean {
  return typeof e === 'object' && e !== null && (e as { code?: number }).code === 11000;
}
