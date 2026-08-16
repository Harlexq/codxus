import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ErrorResponse } from 'codxus-shared';
import { Request, Response } from 'express';

import { LoggerService } from '@app/core/logger/logger.service';

// @Catch() parametresiz: HttpException olmayanlar dahil TUM hatalari yakalar.
// Onceki hali @Catch(HttpException) idi; Prisma hatalari, TypeError gibi
// beklenmeyenler Nest'in varsayilan filtresine dusup zarf disi JSON donuyordu.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  // Filter APP_FILTER provider'i olarak kaydedildigi icin normal constructor
  // injection calisir. main.ts'te "new AllExceptionsFilter()" ile elle
  // olusturulsaydi DI alamaz, logger'i enjekte edemezdik.
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;

    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const error = isHttpException ? exception.name : 'InternalServerError';

    const message = isHttpException
      ? this.extractMessage(exception)
      : // Beklenmeyen hatanin detayi disariya cikmaz: stack trace, SQL
        // parcasi veya dosya yolu sizdirmak recon icin hediye olur.
        'Beklenmeyen bir hata oluştu.';

    const body: ErrorResponse = {
      success: false,
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: req.url,
      requestId: req.requestId,
    };

    // 500 ve ustu: bizim hatamiz, stack trace ile logla. 4xx istemci
    // hatasidir, gurultu yapmasin. (HttpStatus enum'u ile karsilastirmak
    // yerine duz sayi: status number tipinde, enum karsilastirmasi degil.)
    if (status >= 500) {
      this.logger.error(
        'Unhandled exception',
        exception instanceof Error ? exception.stack : undefined,
        {
          requestId: req.requestId,
          method: req.method,
          url: req.url,
          statusCode: status,
        },
      );
    }

    res.status(status).json(body);
  }

  private extractMessage(exception: HttpException): string | string[] {
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    if (typeof response === 'object' && 'message' in response) {
      const raw = (response as { message?: unknown }).message;

      if (Array.isArray(raw)) {
        return raw.filter((item): item is string => typeof item === 'string');
      }

      if (typeof raw === 'string') {
        return raw;
      }
    }

    return exception.message;
  }
}
