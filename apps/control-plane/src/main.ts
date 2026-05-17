import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { getEnv } from './config/env';
import { runMigrations } from './db/database';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const env = getEnv();

  await runMigrations();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: env.NODE_ENV === 'development' }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('SimForge Control Plane')
    .setDescription('Distributed behavioral simulation engine API')
    .setVersion('0.1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(env.PORT, '0.0.0.0');
  console.log(`[SimForge] Control plane running on port ${env.PORT}`);
  console.log(
    `[SimForge] Swagger docs at http://localhost:${env.PORT}/api/docs`,
  );
}

bootstrap();
