import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ErrorResponse } from 'codxus-shared';
import { Request, Response } from 'express';

@Catch(HttpException)
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;

    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const error = isHttpException ? exception.name : 'InternalServerError';
    const exceptionResponse = isHttpException ? exception.getResponse() : null;

    let message: string | string[] = 'Unexpected error occurred';

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      const raw = (exceptionResponse as { message?: unknown }).message;
      if (Array.isArray(raw)) {
        message = raw as string[];
      } else if (typeof raw === 'string') {
        message = raw;
      }
    }

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: req.url,
      requestId: req.requestId,
    };

    res.status(status).json(errorResponse);
  }
}
