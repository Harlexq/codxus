import { Module } from '@nestjs/common';

import { CacheModule } from '@app/providers/cache/cache.module';

import { HibpService } from './hibp.service';

@Module({
  imports: [CacheModule],
  providers: [HibpService],
  exports: [HibpService],
})
export class HibpModule {}
