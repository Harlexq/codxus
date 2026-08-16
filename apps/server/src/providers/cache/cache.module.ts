import { Module } from '@nestjs/common';

import { RedisModule } from '@app/providers/redis/redis.module';

import { CacheService } from './cache.service';

@Module({
  // RedisModule'u import etmek REDIS_CLIENT token'ini bu modulun
  // enjeksiyon kapsamina sokar; import edilmezse CacheService'in
  // constructor'i cozulemez ve uygulama acilista hata verir.
  imports: [RedisModule],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
