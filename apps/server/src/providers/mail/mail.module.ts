import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import mailConfig from '@app/config/mail.config';

import { MailProcessor } from './mail.processor';
import { MailProducer } from './mail.producer';
import { MailService } from './mail.service';
import { MAIL_QUEUE } from './mail.types';

@Module({
  imports: [
    // forFeature: mailConfig namespace'ini bu modulun kapsaminda kullanilabilir
    // kilar. ConfigModule global olsa da registerAs ile tanimlanan
    // namespace'ler ayrica yuklenmek zorunda.
    ConfigModule.forFeature(mailConfig),
    // registerQueue: kuyrugu tanimlar. Baglanti ayarlari AppModule'deki
    // BullModule.forRootAsync'ten miras alinir.
    BullModule.registerQueue({ name: MAIL_QUEUE }),
  ],
  providers: [MailService, MailProducer, MailProcessor],
  // Disariya sadece MailProducer aciliyor: baska modullerin SMTP'ye
  // dogrudan erisimi olmasin, her mail kuyruktan gecsin.
  exports: [MailProducer],
})
export class MailModule {}
