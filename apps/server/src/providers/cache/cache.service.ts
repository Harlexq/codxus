import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

import { REDIS_CLIENT } from '@app/providers/redis/redis.constants';

@Injectable()
export class CacheService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | undefined> {
    const raw = await this.redis.get(key);

    if (raw === null) {
      return undefined;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      // Bozuk/eski formatli kayit: cache miss gibi davran, patlatma.
      return undefined;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const payload = JSON.stringify(value);

    if (ttlSeconds === undefined) {
      await this.redis.set(key, payload);
      return;
    }

    await this.redis.set(key, payload, 'EX', ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /**
   * Prefix ile eslesen tum anahtarlari siler.
   *
   * SCAN kullaniliyor, KEYS degil: KEYS tum keyspace'i tek islemde tarar ve
   * bu sure boyunca Redis'i bloklar. SCAN kucuk parcalar halinde ilerler.
   */
  async delByPrefix(prefix: string): Promise<void> {
    const stream = this.redis.scanStream({
      match: `${prefix}*`,
      count: 100,
    });

    for await (const keys of stream as AsyncIterable<string[]>) {
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
  }
}
