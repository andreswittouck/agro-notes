import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, OpenAPIObject } from '@nestjs/swagger';
import * as dotenv from 'dotenv';

// Carga variables del .env antes de iniciar Nest
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // === CORS ===
  const corsOrigin = process.env.CORS_ORIGIN || '*';
  app.enableCors({
    origin: corsOrigin,
  });

  // === Pipes de validación global ===
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina campos no definidos en el DTO
      forbidNonWhitelisted: true, // lanza error si hay campos no permitidos
      transform: true, // transforma payloads al tipo del DTO
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ===== Swagger =====
  function buildSwaggerConfig(): Omit<OpenAPIObject, 'paths'> {
    const builder = new DocumentBuilder()
      .setTitle('Agro Notes API')
      .setDescription('API for managing field notes by voice or manual entry')
      .setVersion('1.0.0')
      .addTag('notes');
    return builder.build();
  }

  const swaggerConfig = buildSwaggerConfig();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  // === Server ===
  const port = Number(process.env.PORT) || 4000;
  await app.listen(port);

  console.log(`🚀 Agro Notes API running on http://localhost:${port}`);
  console.log(`📘 Swagger Docs: http://localhost:${port}/docs`);
}

void bootstrap();
