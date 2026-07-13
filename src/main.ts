import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation: every incoming request is checked against its DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips unknown fields not in the DTO
      forbidNonWhitelisted: true, // rejects requests with extra unknown fields
      transform: true, // auto-converts payloads into DTO class instances
    }),
  );

  // Allow the frontend to call this API later (adjust origin when frontend exists)
  app.enableCors({
    origin: true, // during development; we'll restrict this in Phase 8
    credentials: true,
  });

  // Swagger setup — auto-generated API docs
  const config = new DocumentBuilder()
    .setTitle('CareerCompass AI API')
    .setDescription('API documentation for the CareerCompass AI backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application running on: http://localhost:${port}`);
  console.log(`Swagger docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();
