import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Request, Response } from 'express';
import { StandardResponse } from 'src/core/interfaces/standard-response.interface';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  T | StandardResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<T | StandardResponse<T>> {
    const ctx = context.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    return next.handle().pipe(
      map((data: T): T | StandardResponse<T> => {
        if (data === undefined || data === null) {
          return {
            success: true,
            statusCode: res.statusCode,
            data: null,
            timestamp: new Date().toISOString(),
            path: req.url,
            requestId: req.requestId,
          } as StandardResponse<T>;
        }

        return {
          success: true,
          statusCode: res.statusCode,
          data,
          timestamp: new Date().toISOString(),
          path: req.url,
          requestId: req.requestId,
        };
      }),
    );
  }
}
