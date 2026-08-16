import { Global, Module } from '@nestjs/common';

import { LoggerService } from './logger.service';

// @Global(): bu modulu bir kere (AppModule'de) import etmek yeterli,
// LoggerService her modulde ayrica import gerektirmeden enjekte edilebilir.
// Global modul kullanimi kotuye gidebilir; burada hakli cunku logger
// gercekten her katmanda lazim ve tek bir ornegi var.
@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
