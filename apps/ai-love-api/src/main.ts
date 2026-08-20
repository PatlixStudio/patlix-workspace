/**
 * Bootstrap for the ai-love API.
 *
 * Serves the companion catalog over a REST API under the `/api` prefix with
 * Swagger documentation at `/api/docs`. The API is stateless in this milestone
 * (seeded companion data), so it only needs the shared Postgres once
 * persistence for chats/profiles is introduced.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: true });
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ai-love API')
    .setDescription(
      'AI Companion catalog: seeded profiles (8 female + 6 male) served to the ai-love-web dashboard.',
    )
    .setVersion('1.0.0')
    .addTag('companions')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(`${globalPrefix}/docs`, app, document);

  const port = process.env.PORT || 3006;
  await app.listen(port);
  Logger.log(
    `🚀 ai-love API running on: http://localhost:${port}/${globalPrefix}`,
  );
  Logger.log(`Swagger docs: http://localhost:${port}/${globalPrefix}/docs`);
}

bootstrap();