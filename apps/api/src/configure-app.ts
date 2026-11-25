import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ErrorCode } from '@hcc/shared';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { AppException } from './common/app.exception';
import { API_PREFIX } from './config/constants';

/** Built React app (apps/web/dist), resolved from apps/api/dist or apps/api/src. */
export const WEB_DIST = join(__dirname, '..', '..', 'web', 'dist');

/** Shared by main.ts and the e2e tests so both run the exact same pipeline. */
export function configureApp(app: NestExpressApplication): void {
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https://*.dzcdn.net'],
          mediaSrc: ["'self'", 'https://*.dzcdn.net'],
          connectSrc: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: () => new AppException(ErrorCode.VALIDATION_ERROR),
    }),
  );
  serveWeb(app);
}

/** Serves the SPA (same origin as the API): hashed assets immutable, index.html no-cache. */
function serveWeb(app: NestExpressApplication): void {
  if (!existsSync(join(WEB_DIST, 'index.html'))) return;
  const indexHtml = join(WEB_DIST, 'index.html');
  app.use(
    express.static(WEB_DIST, {
      index: false,
      setHeaders: (res, path) => {
        res.setHeader(
          'Cache-Control',
          path.includes(`${join('dist', 'assets')}`) ? 'public, max-age=31536000, immutable' : 'no-cache',
        );
      },
    }),
  );
  app.use((req: Request, res: Response, next: NextFunction) => {
    const isApi = req.path === `/${API_PREFIX}` || req.path.startsWith(`/${API_PREFIX}/`);
    if ((req.method !== 'GET' && req.method !== 'HEAD') || isApi || !req.accepts('html')) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(indexHtml);
  });
}
