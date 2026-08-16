import { createHash } from 'crypto';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CACHE_KEYS, CACHE_TTL } from '@app/common/constants/cache.constant';
import { LoggerService } from '@app/core/logger/logger.service';
import { CacheService } from '@app/providers/cache/cache.service';

const HIBP_RANGE_ENDPOINT = 'https://api.pwnedpasswords.com/range';

/**
 * Have I Been Pwned "Pwned Passwords" kontrolu — k-anonymity ile.
 *
 * Sifre hicbir zaman disariya cikmaz: SHA-1'inin sadece ILK 5 karakteri
 * gonderilir, servis o prefix ile baslayan tum hash'lerin listesini doner
 * ve eslesmeyi biz lokalde yapariz.
 */
@Injectable()
export class HibpService {
  private readonly timeoutMs: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly logger: LoggerService,
  ) {
    this.timeoutMs = this.configService.get<number>('HIBP_TIMEOUT_MS', 3000);
  }

  async isPwned(password: string): Promise<boolean> {
    try {
      const sha1 = createHash('sha1')
        .update(password)
        .digest('hex')
        .toUpperCase();

      const prefix = sha1.slice(0, 5);
      const suffix = sha1.slice(5);

      const suffixes = await this.getRangeSuffixes(prefix);

      return suffixes.has(suffix);
    } catch (error) {
      // FAIL-OPEN (brief Bolum 6): dis servis erisilemezse kayit
      // bloklanmaz, sadece loglanir. Aksi halde HIBP'nin kesintisi
      // bizim kayit akisimizi da durdururdu.
      this.logger.warn('HIBP kontrolu basarisiz, sifreye izin verildi', {
        message: error instanceof Error ? error.message : String(error),
      });

      return false;
    }
  }

  private async getRangeSuffixes(prefix: string): Promise<Set<string>> {
    const cacheKey = CACHE_KEYS.hibpRange(prefix);

    const cached = await this.cacheService.get<string>(cacheKey);

    if (cached !== undefined) {
      return this.parseSuffixes(cached);
    }

    const text = await this.fetchRange(prefix);

    await this.cacheService.set(cacheKey, text, CACHE_TTL.HIBP);

    return this.parseSuffixes(text);
  }

  private parseSuffixes(responseText: string): Set<string> {
    const suffixes = new Set<string>();

    for (const line of responseText.split('\n')) {
      const trimmed = line.trim();
      const colonIndex = trimmed.indexOf(':');

      if (colonIndex === -1) {
        continue;
      }

      const suffix = trimmed.slice(0, colonIndex);
      const count = Number(trimmed.slice(colonIndex + 1));

      if (suffix.length > 0 && count > 0) {
        suffixes.add(suffix);
      }
    }

    return suffixes;
  }

  private async fetchRange(prefix: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.timeoutMs);

    try {
      const response = await fetch(`${HIBP_RANGE_ENDPOINT}/${prefix}`, {
        signal: controller.signal,
        headers: {
          // Yanit boyutundan hangi prefix'in sorguldugunu tahmin etmeyi
          // zorlastirir; k-anonymity'yi guclendiren ucretsiz bir onlem.
          'Add-Padding': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(`HIBP API hatasi: ${String(response.status)}`);
      }

      return await response.text();
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
