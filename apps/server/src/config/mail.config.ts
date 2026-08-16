import { registerAs } from '@nestjs/config';

export interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromAddress: string;
  fromName: string;
}

// registerAs: config'i 'mail' namespace'i altinda toplar. Tuketen taraf
// @Inject(mailConfig.KEY) ile TIPLI olarak alir; env degiskenlerini tek tek
// getOrThrow ile okumaktan hem daha kisa hem daha guvenli.
// Degerlerin varligi zaten env.validation.ts'te Joi ile garanti altinda.
export default registerAs(
  'mail',
  (): MailConfig => ({
    host: process.env.MAIL_HOST ?? 'localhost',
    port: Number(process.env.MAIL_PORT ?? 1025),
    secure: process.env.MAIL_SECURE === 'true',
    user: process.env.MAIL_USER ?? '',
    password: process.env.MAIL_PASSWORD ?? '',
    fromAddress: process.env.MAIL_FROM_ADDRESS ?? 'noreply@codxus.com',
    fromName: process.env.MAIL_FROM_NAME ?? 'Codxus',
  }),
);
