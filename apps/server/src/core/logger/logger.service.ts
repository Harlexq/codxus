import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import path from 'path';
import fs from 'fs';
import { Logger, createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: Logger;

  constructor(private readonly configService: ConfigService) {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const fileTransport = new DailyRotateFile({
      filename: path.join(logDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      auditFile: path.join(logDir, 'audit.json'),
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json(),
      ),
    });

    const consoleTransport = new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf((info) => {
          const timestamp =
            typeof info.timestamp === 'string' ? info.timestamp : '';

          const level = typeof info.level === 'string' ? info.level : '';

          const message =
            typeof info.message === 'string'
              ? info.message
              : JSON.stringify(info.message);

          const meta: Record<string, unknown> = {};

          for (const key in info) {
            if (!['timestamp', 'level', 'message'].includes(key)) {
              meta[key] = info[key];
            }
          }

          return `${timestamp} [${level}] ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta) : ''
          }`;
        }),
      ),
    });

    this.logger = createLogger({
      level: configService.get<string>('LOG_LEVEL') || 'info',
      defaultMeta: { service: 'api' },
      transports: [fileTransport, consoleTransport],
      exitOnError: false,
    });
  }

  log(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  error(message: string, trace?: string, meta?: Record<string, unknown>): void {
    this.logger.error(message, { trace, ...meta });
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }

  verbose(message: string, meta?: Record<string, unknown>): void {
    this.logger.verbose(message, meta);
  }
}
