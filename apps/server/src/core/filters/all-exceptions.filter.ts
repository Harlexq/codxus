import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ErrorResponse } from 'codxus-shared';
import { Request, Response } from 'express';
import {
  I18nContext,
  I18nService,
  I18nValidationError,
  I18nValidationException,
} from 'nestjs-i18n';
// formatI18nErrors nestjs-i18n'in kok index'inden export EDILMIYOR ama
// paketin bir "exports" haritasi da yok, yani derin import cozuluyor ve
// tipli geliyor. Kendi cevirici mantigimizi yazmak yerine bunu tercih
// ettik: dosya tasinirsa DERLEME hatasi aliriz, sessizce bozulmaz.
import { formatI18nErrors } from 'nestjs-i18n/dist/utils/util';

import { LoggerService } from '@app/core/logger/logger.service';

// @Catch() parametresiz: HttpException olmayanlar dahil TUM hatalari yakalar.
// Onceki hali @Catch(HttpException) idi; Prisma hatalari, TypeError gibi
// beklenmeyenler Nest'in varsayilan filtresine dusup zarf disi JSON donuyordu.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  // Filter APP_FILTER provider'i olarak kaydedildigi icin normal constructor
  // injection calisir. main.ts'te "new AllExceptionsFilter()" ile elle
  // olusturulsaydi DI alamaz, logger ve i18n'i enjekte edemezdik.
  constructor(
    private readonly logger: LoggerService,
    private readonly i18n: I18nService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const { status, error, message } = this.describe(exception);

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

  private describe(exception: unknown): {
    status: number;
    error: string;
    message: string | string[];
  } {
    // Validation hatalari i18n anahtarlarini tasir; ceviri PIPE'ta degil
    // burada yapilir. nestjs-i18n'in kendi filtresini kullanmiyoruz cunku
    // o kendi govdesini yazar ve StandardResponse zarfini bozardi.
    if (exception instanceof I18nValidationException) {
      const translated = formatI18nErrors(exception.errors, this.i18n, {
        lang: I18nContext.current()?.lang,
      });

      return {
        status: HttpStatus.BAD_REQUEST,
        error: 'ValidationError',
        message: this.flattenValidationErrors(translated),
      };
    }

    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        error: exception.name,
        message: this.extractMessage(exception),
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'InternalServerError',
      // Beklenmeyen hatanin detayi disariya cikmaz: stack trace, SQL
      // parcasi veya dosya yolu sizdirmak recon icin hediye olur.
      message: 'Beklenmeyen bir hata oluştu.',
    };
  }

  private flattenValidationErrors(errors: I18nValidationError[]): string[] {
    const messages: string[] = [];

    for (const error of errors) {
      if (error.constraints !== undefined) {
        messages.push(...Object.values(error.constraints));
      }

      if (error.children !== undefined && error.children.length > 0) {
        messages.push(...this.flattenValidationErrors(error.children));
      }
    }

    return messages;
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
