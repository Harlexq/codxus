import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { I18nValidationPipe } from 'nestjs-i18n';

import swaggerSetup from '@app/config/swagger.config';
import { LoggerService } from '@app/core/logger/logger.service';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  // bufferLogs: DI container ayaga kalkana kadar uretilen loglar tamponlanir,
  // useLogger cagrildiktan sonra bizim winston servisimize aktarilir.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // app.get(): DI container'dan bir provider'i elle cekmek icin. Bootstrap
  // asamasinda constructor injection yapamadigimiz tek yer burasidir.
  app.useLogger(app.get(LoggerService));

  const config = app.get(ConfigService);

  // Express varsayilan olarak "X-Powered-By: Express" gonderir; sunucu
  // parmak izi vermenin bedava yolu, kapatiyoruz. NestExpressApplication
  // tipi sayesinde express ayarlarina tipli erisiyoruz (getInstance() any doner).
  app.disable('x-powered-by');

  // CSP, HSTS, X-Frame-Options, X-Content-Type-Options vb.
  app.use(helmet());

  app.enableCors({
    origin: config
      .getOrThrow<string>('CORS_ORIGINS')
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // I18nValidationPipe: ValidationPipe'in i18n farkindali versiyonu.
  // Hata mesajlarini burada CEVIRMEZ; I18nValidationException firlatir ve
  // ceviriyi AllExceptionsFilter yapar. Boylece hatalar da StandardResponse
  // zarfindan cikar (nestjs-i18n'in kendi filtresi zarfi bozardi).
  app.useGlobalPipes(
    new I18nValidationPipe({
      // whitelist: DTO'da tanimsiz alanlari gövdeden siler.
      whitelist: true,
      // forbidNonWhitelisted: silmek yerine 400 doner. Sessiz veri kaybi
      // yerine acik hata; frontend yanlis alan gonderdiginde hemen anlasilir.
      forbidNonWhitelisted: true,
      // transform: gelen JSON'u DTO sinifina cevirir; @Transform
      // dekoratorlerimizin (Trim/TrimLower) calismasi buna bagli.
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // SIGTERM/SIGINT geldiginde onModuleDestroy ve onApplicationShutdown
  // hook'lari calisir; Prisma baglantisi duzgun kapanir.
  app.enableShutdownHooks();

  swaggerSetup(app);

  const port = config.getOrThrow<number>('SERVER_PORT');
  await app.listen(port);

  const logger = app.get(LoggerService);
  logger.log('Uygulama basladi', {
    api: `http://localhost:${String(port)}/api`,
    docs: `http://localhost:${String(port)}/api/docs`,
  });
}

void bootstrap();
