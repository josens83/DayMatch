import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private context?: string;

  constructor(private configService: ConfigService) {
    const isProduction = configService.get('app.env') === 'production';

    const formats = [
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
    ];

    if (isProduction) {
      formats.push(winston.format.json());
    } else {
      formats.push(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
          const contextStr = context ? `[${context}]` : '';
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          const traceStr = trace ? `\n${trace}` : '';
          return `${timestamp} ${level} ${contextStr} ${message} ${metaStr}${traceStr}`;
        }),
      );
    }

    const transports: winston.transport[] = [
      new winston.transports.Console({
        level: isProduction ? 'info' : 'debug',
      }),
    ];

    if (isProduction) {
      // Daily rotate file for production
      transports.push(
        new winston.transports.DailyRotateFile({
          filename: 'logs/app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          level: 'info',
        }),
        new winston.transports.DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          level: 'error',
        }),
      );
    }

    this.logger = winston.createLogger({
      level: isProduction ? 'info' : 'debug',
      format: winston.format.combine(...formats),
      transports,
      exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exceptions.log' }),
      ],
      rejectionHandlers: [
        new winston.transports.File({ filename: 'logs/rejections.log' }),
      ],
    });
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context: context || this.context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context: context || this.context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context: context || this.context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context: context || this.context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context: context || this.context });
  }

  // Custom methods for structured logging
  logRequest(method: string, url: string, statusCode: number, duration: number, userId?: string) {
    this.logger.info('HTTP Request', {
      context: 'HTTP',
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      userId,
    });
  }

  logEvent(event: string, data: Record<string, any>) {
    this.logger.info(event, { context: 'Event', ...data });
  }

  logPayment(action: string, data: Record<string, any>) {
    this.logger.info(`Payment: ${action}`, { context: 'Payment', ...data });
  }

  logSecurity(action: string, data: Record<string, any>) {
    this.logger.warn(`Security: ${action}`, { context: 'Security', ...data });
  }
}
