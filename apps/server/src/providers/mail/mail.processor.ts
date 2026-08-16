import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { LoggerService } from '@app/core/logger/logger.service';

import { MailService } from './mail.service';
import {
  AccountExistsPayload,
  MAIL_QUEUE,
  MailJob,
  MailPayload,
  VerifyEmailPayload,
  WelcomePayload,
} from './mail.types';

// @Processor: bu sinifi 'mail' kuyrugunun worker'i yapar. WorkerHost'tan
// tureyip process() metodunu yazmak yeterli; Nest worker'in yasam dongusunu
// (baslatma, kapatma) kendisi yonetir.
@Processor(MAIL_QUEUE)
export class MailProcessor extends WorkerHost {
  constructor(
    private readonly mailService: MailService,
    private readonly logger: LoggerService,
  ) {
    // WorkerHost'un constructor'i cagrilmali; aksi halde Nest worker'i
    // baglayamaz.
    super();
  }

  async process(job: Job<MailPayload>): Promise<void> {
    switch (job.name) {
      case MailJob.VERIFY_EMAIL:
        await this.mailService.sendVerifyEmail(job.data as VerifyEmailPayload);
        return;

      case MailJob.ACCOUNT_EXISTS:
        await this.mailService.sendAccountExists(
          job.data as AccountExistsPayload,
        );
        return;

      case MailJob.WELCOME:
        await this.mailService.sendWelcome(job.data as WelcomePayload);
        return;

      default:
        // Hata firlatirsak BullMQ isi yeniden dener; bilinmeyen bir is adi
        // yeniden denemeyle duzelmeyecegi icin sadece logluyoruz.
        this.logger.error('Bilinmeyen mail isi', undefined, {
          jobName: job.name,
          jobId: job.id,
        });
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<MailPayload> | undefined, error: Error): void {
    this.logger.error('Mail isi basarisiz', error.stack, {
      jobName: job?.name,
      jobId: job?.id,
      attempts: job?.attemptsMade,
      message: error.message,
    });
  }
}
