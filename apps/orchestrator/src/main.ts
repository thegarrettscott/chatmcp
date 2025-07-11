import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
// import { setupTracing } from './tracing';

async function bootstrap() {
  // Setup OpenTelemetry tracing
  // await setupTracing();

  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: [
      'https://chatmcp.vercel.app',
      'https://chatmcp-nu.vercel.app',
      process.env.NEXT_PUBLIC_APP_URL || 'https://chatmcp.vercel.app'
    ],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('ChatMCP Orchestrator API')
    .setDescription('The ChatMCP orchestrator API for managing AI conversations and MCP tools')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  
  console.log(`🚀 Orchestrator is running on: https://chatmcp.fly.dev`);
  console.log(`📚 API Documentation: https://chatmcp.fly.dev/api`);
}

bootstrap(); 