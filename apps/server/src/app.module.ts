import path from 'path';

import { BullModule } from '@nestjs/bullmq';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import {
  AcceptLanguageResolver,
  I18nContext,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';

import cookieConfig from '@app/config/cookie.config';
import { envValidationSchema } from '@app/config/env.validation';
import { AllExceptionsFilter } from '@app/core/filters/all-exceptions.filter';
import { LoggingInterceptor } from '@app/core/interceptors/logging.interceptor';
import { ResponseInterceptor } from '@app/core/interceptors/response.interceptor';
import { LoggerModule } from '@app/core/logger/logger.module';
import { RequestIdMiddleware } from '@app/core/middleware/request-id.middleware';
import { PrismaModule } from '@app/database/prisma.module';
import { AuthModule } from '@app/modules/auth/auth.module';
import { MailModule } from '@app/providers/mail/mail.module';
import { extractEmailTracker } from '@app/common/utils/throttler.util';
import { parseRedisUrl } from '@app/providers/redis/redis.util';

const ENVIRONMENT = process.env.NODE_ENV ?? 'development';

@Module({
  imports: [
    ConfigModule.forRoot({
      // isGlobal: ConfigService'i her modulde ayrica import etmeden
      // enjekte edebilmek icin. Config gercekten her yerde lazim olan
      // birkac seyden biri; global yapmak burada dogru.
      isGlobal: true,
      envFilePath: path.resolve(process.cwd(), '../../', `.env.${ENVIRONMENT}`),
      validationSchema: envValidationSchema,
      // registerAs ile tanimlanan namespace'li config'ler burada yuklenir;
      // configService.get('cookie.maxAge') seklinde okunur.
      load: [cookieConfig],
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'tr',
      loaderOptions: {
        // __dirname build sonrasi dist/ oldugu icin ceviriler dist/i18n
        // altindan okunur; kopyalamayi nest-cli.json assets yapar.
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      // Dil cozumleyiciler sirayla denenir, ilk sonuc kazanir. Su an sadece
      // tr var; bunlar simdiden dursun ki ikinci dil eklenince hicbir sey
      // degismesin. Hicbiri eslesmezse fallbackLanguage kullanilir.
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),
    // BullMQ kok kaydi: baglanti ayarlari burada bir kez verilir, tekil
    // kuyruklar (MailModule'deki registerQueue gibi) bunu miras alir.
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: parseRedisUrl(config.getOrThrow<string>('REDIS_URL')),
      }),
    }),
    // Rate limit iki BAGIMSIZ boyutta calisiyor (brief Bolum 6):
    // 'ip'    -> varsayilan tracker (istegin IP'si)
    // 'email' -> govdedeki e-posta
    // Ayni istek her iki sayaci da tuketir; biri dolarsa 429 doner.
    // Buradaki degerler tabandir, endpoint'ler @Throttle ile daraltir.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // Sayaclar Redis'te: surec yeniden baslayinca sifirlanmaz ve
        // birden fazla instance ayni limiti paylasir.
        storage: new ThrottlerStorageRedisService(
          config.getOrThrow<string>('REDIS_URL'),
        ),
        // Varsayilan mesaj Ingilizce ("ThrottlerException: Too Many
        // Requests") ve zarfin icine oyle giriyordu. Guard, i18n
        // middleware'inden SONRA calistigi icin I18nContext hazir.
        errorMessage: (): string => {
          const translated = I18nContext.current()?.t(
            'common.TOO_MANY_REQUESTS',
          );

          return typeof translated === 'string'
            ? translated
            : 'Çok fazla istek gönderdiniz.';
        },
        throttlers: [
          { name: 'ip', limit: 100, ttl: 60_000 },
          {
            name: 'email',
            limit: 100,
            ttl: 60_000,
            getTracker: (req: Record<string, unknown>) =>
              `email:${extractEmailTracker(req) ?? ''}`,
            // Govdesinde e-posta olmayan endpoint'lerde bu boyut hic
            // calismaz; yoksa hepsi tek ortak sayaca duserdi.
            skipIf: (context) =>
              extractEmailTracker(context.switchToHttp().getRequest()) === null,
          },
        ],
      }),
    }),
    LoggerModule,
    PrismaModule,
    MailModule,
    AuthModule,
  ],
  providers: [
    // APP_FILTER / APP_INTERCEPTOR: global filter ve interceptor'lari DI
    // uzerinden kaydetmenin yolu. main.ts'teki useGlobalFilters(new X())
    // yerine bunu kullaniyoruz, boylece bagimliliklari enjekte edilebiliyor.
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Global guard: her endpoint taban limitle korunur, auth uclari
    // @Throttle ile daha siki degerler kullanir.
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Interceptor sirasi kayit sirasidir: ilk yazilan en distaki katmandir.
    // LoggingInterceptor once gelmeli ki olculen sure tum zinciri kapsasin.
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  // Middleware'ler modul seviyesinde baglanir ve guard/interceptor/pipe
  // zincirinden ONCE calisir. requestId'nin log ve hata zarflarinda hazir
  // olmasi icin en erken nokta burasi.
  configure(consumer: MiddlewareConsumer): void {
    // '{*splat}': Express 5 / path-to-regexp v8 ile gelen yeni wildcard
    // sozdizimi. Eski '*' artik desteklenmiyor (Nest 11 gecis notu).
    consumer.apply(RequestIdMiddleware).forRoutes('{*splat}');
  }
}
