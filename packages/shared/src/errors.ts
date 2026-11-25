/** Error codes returned by the API in `{ statusCode, code, message }` (docs/03-API.md §1). */
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_GUEST_ID: 'INVALID_GUEST_ID',
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  NOT_FOUND: 'NOT_FOUND',
  TRACK_NOT_FOUND: 'TRACK_NOT_FOUND',
  TRACK_HIDDEN: 'TRACK_HIDDEN',
  SUBMISSIONS_CLOSED: 'SUBMISSIONS_CLOSED',
  RATE_LIMITED: 'RATE_LIMITED',
  DEEZER_UNAVAILABLE: 'DEEZER_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export interface ApiErrorBody {
  statusCode: number;
  code: ErrorCode;
  message: string;
}
