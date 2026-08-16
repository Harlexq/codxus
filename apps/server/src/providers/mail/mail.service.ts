import fs from 'fs';
import path from 'path';

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
// import type: isolatedModules + emitDecoratorMetadata acikken, dekoratorlu
// bir imzada gecen tip degeri olarak import edilirse TS1272 verir.
import type { ConfigType } from '@nestjs/config';
import Handlebars from 'handlebars';
import { I18nService } from 'nestjs-i18n';
import nodemailer, { Transporter } from 'nodemailer';

import mailConfig from '@app/config/mail.config';
import { LoggerService } from '@app/core/logger/logger.service';

import {
  AccountExistsPayload,
  MailJob,
  MailJobName,
  VerifyEmailPayload,
  WelcomePayload,
} from './mail.types';

// Sablonlar build zamaninda MJML'den HTML'e derlenir (scripts/build-templates.mjs)
// ve nest-cli assets ile dist'e kopyalanir. __dirname prod'da dist/providers/mail.
const TEMPLATE_DIR = path.join(__dirname, 'templates', 'compiled');

@Injectable()
export class MailService implements OnModuleInit {
  private transporter!: Transporter;

  // Derlenmis sablonlar surec omru boyunca bellekte tutulur; her mailde
  // dosya okuyup Handlebars derlemek gereksiz maliyet.
  private readonly templates = new Map<
    MailJobName,
    HandlebarsTemplateDelegate<Record<string, unknown>>
  >();

  constructor(
    // @Inject(mailConfig.KEY): registerAs ile tanimlanan namespace'i TIPLI
    // olarak enjekte etmenin yolu. ConfigType<typeof mailConfig> donus tipini
    // factory'den otomatik cikarir.
    @Inject(mailConfig.KEY)
    private readonly config: ConfigType<typeof mailConfig>,
    private readonly i18n: I18nService,
    private readonly logger: LoggerService,
  ) {}

  // onModuleInit: modul bagimliliklari cozuldukten sonra, uygulama istek
  // almaya baslamadan once calisir. Transporter'i burada kurmak
  // constructor'da kurmaya gore test edilebilirligi artirir.
  onModuleInit(): void {
    this.transporter = nodemailer.createTransport({
      host: this.config.host,
      port: this.config.port,
      secure: this.config.secure,
      // Mailpit kimlik dogrulamasi istemiyor; kullanici bossa auth'u hic
      // gondermiyoruz, aksi halde SMTP el sikismasi basarisiz olur.
      auth:
        this.config.user.length > 0
          ? { user: this.config.user, pass: this.config.password }
          : undefined,
    });
  }

  async sendVerifyEmail(payload: VerifyEmailPayload): Promise<void> {
    await this.send(MailJob.VERIFY_EMAIL, payload.to, payload.locale, {
      firstName: payload.firstName,
      verificationUrl: payload.verificationUrl,
      ttlHours: payload.ttlHours,
    });
  }

  async sendAccountExists(payload: AccountExistsPayload): Promise<void> {
    await this.send(MailJob.ACCOUNT_EXISTS, payload.to, payload.locale, {
      firstName: payload.firstName,
      loginUrl: payload.loginUrl,
    });
  }

  async sendWelcome(payload: WelcomePayload): Promise<void> {
    await this.send(MailJob.WELCOME, payload.to, payload.locale, {
      firstName: payload.firstName,
      appUrl: payload.appUrl,
    });
  }

  private async send(
    template: MailJobName,
    to: string,
    locale: string,
    variables: Record<string, unknown>,
  ): Promise<void> {
    const subject = this.i18n.t(`mail.${template}.subject`, { lang: locale });

    const html = this.render(template, variables);

    await this.transporter.sendMail({
      from: { address: this.config.fromAddress, name: this.config.fromName },
      to,
      subject: typeof subject === 'string' ? subject : template,
      html,
    });

    // Mail ICERIGI loglanmaz; alici ve sablon adi hata ayiklamaya yeter.
    this.logger.log('Mail gonderildi', { template, to });
  }

  private render(
    template: MailJobName,
    variables: Record<string, unknown>,
  ): string {
    const cached = this.templates.get(template);

    if (cached !== undefined) {
      return cached(variables);
    }

    const filePath = path.join(TEMPLATE_DIR, `${template}.html`);

    if (!fs.existsSync(filePath)) {
      throw new Error(
        `Mail sablonu bulunamadi: ${filePath}. "pnpm mail:build" calistirildi mi?`,
      );
    }

    // Handlebars {{degisken}} ciktisisini varsayilan olarak HTML-escape
    // eder; kullanici adi uzerinden HTML injection bu sayede kapali.
    const compiled = Handlebars.compile<Record<string, unknown>>(
      fs.readFileSync(filePath, 'utf-8'),
    );

    this.templates.set(template, compiled);

    return compiled(variables);
  }
}
