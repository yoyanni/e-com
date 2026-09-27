import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const corsOrigin = process.env.CORS_ORIGIN;
  if (!corsOrigin && process.env.NODE_ENV === 'production') {
    throw new Error('CORS_ORIGIN is not defined');
  }

  const app = await NestFactory.create(AppModule);
  /**
   * Since the FE uses Route Handlers and Server Components, CORS isnt required.
   * However, it is setup for security reasons. Without CORS_ORIGIN (dev/test)
   * it stays off, which means same-origin only, never `*`.
   */
  if (corsOrigin) {
    app.enableCors({
      origin: corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });
  }
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
