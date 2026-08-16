import { Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

import { LoggerService } from '@app/core/logger/logger.service';

import { REDIS_CLIENT } from './redis.constants';

@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      // useFactory + inject: provider'i calisma aninda uretmek icin.
      // ConfigService enjekte edilir, donen deger REDIS_CLIENT token'ina
      // baglanir ve bu modulu import eden her yerde ayni ornek kullanilir
      // (Nest provider'lari varsayilan olarak singleton'dir).
      inject: [ConfigService, LoggerService],
      useFactory: (config: ConfigService, logger: LoggerService): Redis => {
        const client = new Redis(config.getOrThrow<string>('REDIS_URL'), {
          // Redis erisilemezse istek sonsuza kadar beklemesin.
          maxRetriesPerRequest: 3,
        });

        // ioredis baglanti hatalarinda 'error' olayini dinleyen yoksa
        // Node surecini unhandled error ile dusurur.
        client.on('error', (error: Error) => {
          logger.error('Redis baglanti hatasi', error.stack, {
            message: error.message,
          });
        });

        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  // main.ts'teki enableShutdownHooks() sayesinde SIGTERM'de cagrilir;
  // baglanti yarim kalmadan kapanir.
  async onApplicationShutdown(): Promise<void> {
    await this.redis.quit();
  }
}
