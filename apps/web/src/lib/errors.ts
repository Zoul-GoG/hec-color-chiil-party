import { ErrorCode } from '@hcc/shared';
import { fr } from '../i18n/fr';
import { ApiError } from './api';

/** Maps any error to its French UI message (docs/03-API.md §1). */
export function errorMessage(e: unknown): string {
  const code = e instanceof ApiError ? e.code : ErrorCode.INTERNAL_ERROR;
  return fr.errors[code] ?? fr.errors.INTERNAL_ERROR;
}

export function errorCode(e: unknown): ErrorCode {
  return e instanceof ApiError ? e.code : ErrorCode.INTERNAL_ERROR;
}
