import 'reflect-metadata';

/**
 * Entry point of patlix-api.
 * Bootstraps the NestJS application with Swagger, validation and CORS.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Enable CORS for the Angular dev server.
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Strip unknown properties and transform payloads to DTO instances.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger documentation at /api/docs.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('patlix-api')
    .setDescription('REST API for the patlix-workspace dashboard.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`🚀 API is running on http://localhost:${port}/${globalPrefix}`);
  Logger.log(`📚 Swagger docs on http://localhost:${port}/${globalPrefix}/docs`);
}

bootstrap();
