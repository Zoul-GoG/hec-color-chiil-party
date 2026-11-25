import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';
import { IS_PRODUCTION, PORT } from './config/constants';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: IS_PRODUCTION ? ['log', 'warn', 'error'] : ['log', 'warn', 'error', 'debug'],
  });
  configureApp(app);
  app.enableShutdownHooks();
  await app.listen(PORT);
  new Logger('Bootstrap').log(`API prête sur http://localhost:${PORT}/api`);
}

void bootstrap();
