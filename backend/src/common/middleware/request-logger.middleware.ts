import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const startTime = Date.now();
    const userId = (req as any).user?.id;

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      this.logger.logRequest(method, originalUrl, res.statusCode, duration, userId);
    });

    next();
  }
}
