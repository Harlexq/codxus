import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import {
  AccountExistsPayload,
  MAIL_JOB_OPTIONS,
  MAIL_QUEUE,
  MailJob,
  MailPayload,
  VerifyEmailPayload,
  WelcomePayload,
} from './mail.types';

/**
 * Mail gonderimini kuyruga birakir.
 *
 * Servis katmani SMTP'yi hicbir zaman dogrudan beklemez: kayit istegi
 * kuyruga yazip hemen doner, gonderim arka planda MailProcessor'da olur.
 * Boylece yavas veya gecici olarak erisilemez bir SMTP sunucusu kullanicinin
 * kayit istegini bloklamaz.
 */
@Injectable()
export class MailProducer {
  // @InjectQueue: BullModule.registerQueue ile tanimlanan kuyrugu enjekte
  // eder. Kuyruk adi MailModule'deki kayitla ayni olmak zorunda.
  constructor(@InjectQueue(MAIL_QUEUE) private readonly queue: Queue) {}

  async enqueueVerifyEmail(payload: VerifyEmailPayload): Promise<void> {
    await this.enqueue(MailJob.VERIFY_EMAIL, payload);
  }

  async enqueueAccountExists(payload: AccountExistsPayload): Promise<void> {
    await this.enqueue(MailJob.ACCOUNT_EXISTS, payload);
  }

  async enqueueWelcome(payload: WelcomePayload): Promise<void> {
    await this.enqueue(MailJob.WELCOME, payload);
  }

  private async enqueue(name: string, payload: MailPayload): Promise<void> {
    await this.queue.add(name, payload, MAIL_JOB_OPTIONS);
  }
}
