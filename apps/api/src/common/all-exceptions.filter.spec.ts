import { BadRequestException, HttpException, NotFoundException } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { ErrorCode } from '@hcc/shared';
import { AppException } from './app.exception';
import { toErrorBody } from './all-exceptions.filter';

describe('toErrorBody', () => {
  it('keeps business errors as-is', () => {
    expect(toErrorBody(new AppException(ErrorCode.TRACK_HIDDEN))).toEqual({
      statusCode: 409,
      code: 'TRACK_HIDDEN',
      message: "Ce morceau n'est pas disponible pour la soirée.",
    });
  });

  it('maps framework errors', () => {
    expect(toErrorBody(new BadRequestException('x')).code).toBe('VALIDATION_ERROR');
    expect(toErrorBody(new NotFoundException()).code).toBe('NOT_FOUND');
    expect(toErrorBody(new ThrottlerException()).code).toBe('RATE_LIMITED');
    expect(toErrorBody(new HttpException('x', 413))).toMatchObject({
      statusCode: 413,
      code: 'VALIDATION_ERROR',
    });
  });

  it('hides unknown errors behind INTERNAL_ERROR', () => {
    expect(toErrorBody(new Error('secret stack'))).toEqual({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Oups, une erreur est survenue.',
    });
  });
});
