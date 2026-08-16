import { JobsOptions } from 'bullmq';

export const MAIL_QUEUE = 'mail';

export const MailJob = {
  VERIFY_EMAIL: 'verify-email',
  ACCOUNT_EXISTS: 'account-exists',
  WELCOME: 'welcome',
} as const;

export type MailJobName = (typeof MailJob)[keyof typeof MailJob];

interface BaseMailPayload {
  to: string;
  firstName: string;
  locale: string;
}

export interface VerifyEmailPayload extends BaseMailPayload {
  verificationUrl: string;
  ttlHours: number;
}

/**
 * Zaten kayitli bir e-posta ile kayit denendiginde gonderilir.
 * Kayit endpoint'i her durumda ayni 201'i dondugu icin kullaniciyi
 * durumdan haberdar edebilecegimiz tek kanal bu mail.
 */
export interface AccountExistsPayload extends BaseMailPayload {
  loginUrl: string;
}

export interface WelcomePayload extends BaseMailPayload {
  appUrl: string;
}

export type MailPayload =
  | VerifyEmailPayload
  | AccountExistsPayload
  | WelcomePayload;

// SMTP gecici olarak erisilemezse is kaybolmasin: 5 deneme, ustel bekleme
// (2sn, 4sn, 8sn, 16sn). Basarililardan son 100'u, basarisizlardan son
// 1000'i tutulur; kuyruk sinirsiz buyumez ama hata ayiklanabilir kalir.
export const MAIL_JOB_OPTIONS: JobsOptions = {
  attempts: 5,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: 100,
  removeOnFail: 1000,
};
