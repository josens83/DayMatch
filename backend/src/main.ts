import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggerService } from './common/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);
  const isProduction = configService.get('app.env') === 'production';

  // Sentry for error tracking
  const sentryDsn = configService.get('sentry.dsn');
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: configService.get('app.env'),
      tracesSampleRate: isProduction ? 0.1 : 1.0,
    });
  }

  // Security
  app.use(helmet({
    contentSecurityPolicy: isProduction ? undefined : false,
    crossOriginEmbedderPolicy: false,
  }));
  app.use(compression());

  // CORS
  const corsOrigins = configService.get('cors.origins') || ['http://localhost:3000'];
  app.enableCors({
    origin: isProduction ? corsOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: isProduction,
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger - only in development
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('DayMatch API')
      .setDescription('DayMatch - 단기 알바 매칭 플랫폼 API')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Enter JWT token',
          in: 'header',
        },
        'access-token',
      )
      .addTag('Auth', '인증 관련 API')
      .addTag('Users', '사용자 관련 API')
      .addTag('Jobs', '일자리 관련 API')
      .addTag('Applications', '지원 관련 API')
      .addTag('Matches', '매칭 관련 API')
      .addTag('Chats', '채팅 관련 API')
      .addTag('Payments', '결제 관련 API')
      .addTag('Reviews', '리뷰 관련 API')
      .addTag('Notifications', '알림 관련 API')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = configService.get('app.port') || 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`, 'Bootstrap');
  logger.log(`Environment: ${configService.get('app.env')}`, 'Bootstrap');

  if (!isProduction) {
    logger.log(`Swagger docs: http://localhost:${port}/api/docs`, 'Bootstrap');
  }
}

bootstrap().catch((error) => {
  console.error('Application failed to start:', error);
  process.exit(1);
});
