import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { LoggerService } from '@app/core/logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - now;
          const statusCode = res.statusCode;

          const meta: Record<string, unknown> = {
            requestId: req.requestId,
            method: req.method,
            url: req.url,
            statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
          };

          if (statusCode >= 400 && statusCode < 500) {
            this.logger.warn('HTTP Request', meta);
          } else {
            this.logger.log('HTTP Request', meta);
          }
        },
        error: (err: unknown) => {
          const duration = Date.now() - now;
          const stack = err instanceof Error ? err.stack : undefined;

          const meta: Record<string, unknown> = {
            requestId: req.requestId,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
          };

          this.logger.error('HTTP Request', stack, meta);
        },
      }),
    );
  }
}
