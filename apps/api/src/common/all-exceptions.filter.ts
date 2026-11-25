import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { ErrorCode, type ApiErrorBody } from '@hcc/shared';
import type { Request, Response } from 'express';
import { AppException, ERROR_MESSAGES } from './app.exception';

function body(statusCode: number, code: ErrorCode): ApiErrorBody {
  return { statusCode, code, message: ERROR_MESSAGES[code] };
}

/** Maps any exception to `{ statusCode, code, message }`; never leaks stack traces. */
export function toErrorBody(exception: unknown): ApiErrorBody {
  if (exception instanceof AppException) return exception.getResponse() as ApiErrorBody;
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    if (status === 429) return body(429, ErrorCode.RATE_LIMITED);
    if (status === 401) return body(401, ErrorCode.UNAUTHORIZED);
    if (status === 403) return body(403, ErrorCode.UNAUTHORIZED);
    if (status === 404) return body(404, ErrorCode.NOT_FOUND);
    if (status >= 400 && status < 500) return body(status, ErrorCode.VALIDATION_ERROR);
    if (status === 503) return body(503, ErrorCode.DEEZER_UNAVAILABLE);
  }
  return body(500, ErrorCode.INTERNAL_ERROR);
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const payload = toErrorBody(exception);
    if (payload.statusCode >= 500) {
      const detail = exception instanceof Error ? (exception.stack ?? exception.message) : String(exception);
      this.logger.error(`${req.method} ${req.path} -> ${payload.statusCode} ${payload.code}`, detail);
    }
    res.status(payload.statusCode).json(payload);
  }
}
