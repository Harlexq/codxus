import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';

import { RequestContext } from '@app/common/context/request-context.interface';
import { emptyToNull } from '@app/common/utils/crypto.util';
import appConfig from '@app/config/app.config';
import securityConfig from '@app/config/security.config';
import { PrismaService } from '@app/database/prisma.service';
import { LoggerService } from '@app/core/logger/logger.service';
import { MailProducer } from '@app/providers/mail/mail.producer';

import { UserRepository } from '../user/user.repository';
import { UserAccount } from '../user/user.types';
import { CreateUserDto } from './dto/create-user.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { RegisterResponseDto } from './dto/response/register-response.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { PasswordService } from './password/password.service';
import { EmailVerificationTokenService } from './token/email-verification-token.service';

const DEFAULT_LOCALE = 'tr';

@Injectable()
export class AuthService {
  constructor(
    @Inject(appConfig.KEY)
    private readonly appSettings: ConfigType<typeof appConfig>,
    @Inject(securityConfig.KEY)
    private readonly security: ConfigType<typeof securityConfig>,
    private readonly prisma: PrismaService,
    private readonly userRepository: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: EmailVerificationTokenService,
    private readonly mailProducer: MailProducer,
    private readonly i18n: I18nService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Kayit.
   *
   * Uc dal var ama DISARIDAN AYIRT EDILEMEZLER: her durumda ayni 201 ve
   * ayni govde doner (brief Bolum 6, user enumeration olmasin).
   *
   *   1. E-posta yeni            -> kullanici + token olusur, dogrulama maili
   *   2. Kayitli ve dogrulanmis  -> hicbir yazma yok, "hesabin zaten var" maili
   *   3. Kayitli, dogrulanmamis  -> veriler DEGISMEZ, yeni token + dogrulama maili
   */
  async register(
    dto: CreateUserDto,
    ctx: RequestContext,
  ): Promise<RegisterResponseDto> {
    // Sifre politikasi varlik kontrolunden ONCE calisiyor. Sonra calissaydi
    // zayif bir sifre yeni e-postada 400, kayitli e-postada 201 donerdi;
    // bu tek basina bir enumeration oracle'i olurdu.
    await this.passwordService.validate(dto.password, {
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });

    // Hash her dalda uretiliyor. 2. ve 3. dalda sonucu kullanmiyoruz ama
    // argon2 maliyeti (~50ms) atlanirsa yanit suresi farki kayitli
    // e-postalari ele verirdi.
    const passwordHash = await this.passwordService.hash(dto.password);

    const existing = await this.userRepository.findActiveByEmail(dto.email);

    if (existing !== null) {
      await this.handleExistingAccount(existing, ctx);

      return { verificationPending: true };
    }

    const now = new Date();

    const { user, token } = await this.prisma.$transaction(async (tx) => {
      // Kullanici ve token tek islemde: mail gonderilecek bir token
      // olusup kullanici olusmamasi (veya tersi) mumkun olmamali.
      const created = await this.userRepository.create(tx, {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash,
        jobTitle: dto.jobTitle ?? null,
        acceptedTermsAt: now,
        acceptedTermsVersion: this.security.termsVersion,
        acceptedPrivacyAt: now,
        acceptedPrivacyVersion: this.security.privacyVersion,
        registrationIp: emptyToNull(ctx.ip),
      });

      const issued = await this.tokenService.issue(tx, created.id, ctx);

      return { user: created, token: issued.token };
    });

    await this.mailProducer.enqueueVerifyEmail({
      to: user.email,
      firstName: user.firstName,
      locale: user.locale,
      verificationUrl: this.buildVerificationUrl(token),
      ttlHours: this.security.emailVerificationTtlHours,
    });

    // AuditLog tablosu sonraki goreve birakildi; kayit olayi simdilik
    // yapisal log olarak tutuluyor.
    this.logger.log('Kullanici kaydedildi', {
      userId: user.id,
      requestId: ctx.requestId,
      ip: ctx.ip,
    });

    return { verificationPending: true };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<void> {
    const outcome = await this.prisma.$transaction(async (tx) => {
      const consumed = await this.tokenService.consume(tx, dto.token);

      if (consumed.status !== 'valid') {
        return consumed;
      }

      const user = await this.userRepository.markEmailVerified(
        tx,
        consumed.userId,
      );

      return { status: 'valid' as const, user };
    });

    if (outcome.status !== 'valid') {
      // Uc durum ayri ayri bildiriliyor: token zaten saldirganin elinde
      // oldugu icin bilgi sizdirmiyor, ama frontend "suresi doldu"
      // durumunda "yeniden gonder" butonu gosterebiliyor.
      throw new BadRequestException(
        this.i18n.t(`auth.${this.tokenErrorKey(outcome.status)}`),
      );
    }

    await this.mailProducer.enqueueWelcome({
      to: outcome.user.email,
      firstName: outcome.user.firstName,
      locale: outcome.user.locale,
      appUrl: this.appSettings.frontendUrl,
    });

    this.logger.log('E-posta dogrulandi', { userId: outcome.user.id });
  }

  /**
   * Dogrulama mailini yeniden gonder.
   *
   * Kullanici yoksa da, e-posta zaten dogrulanmissa da, cooldown doluysa da
   * AYNI bos yanit doner — hangi e-postalarin kayitli oldugu sizmasin diye.
   */
  async resendVerification(
    dto: ResendVerificationDto,
    ctx: RequestContext,
  ): Promise<void> {
    const user = await this.userRepository.findActiveByEmail(dto.email);

    if (user === null || user.emailVerifiedAt !== null) {
      return;
    }

    if (await this.isWithinResendCooldown(user.id)) {
      return;
    }

    await this.issueAndSendVerification(user, ctx);
  }

  private async handleExistingAccount(
    user: UserAccount,
    ctx: RequestContext,
  ): Promise<void> {
    if (user.emailVerifiedAt !== null) {
      await this.mailProducer.enqueueAccountExists({
        to: user.email,
        firstName: user.firstName,
        locale: user.locale,
        loginUrl: `${this.appSettings.frontendUrl}/login`,
      });

      return;
    }

    // Karar 7: bekleyen kaydin verilerine DOKUNMUYORUZ. Aksi halde
    // saldirgan, baskasinin dogrulanmamis kaydinin sifresini ezebilirdi.
    // Cooldown burada da gecerli, yoksa kayit endpoint'i uzerinden bir
    // posta kutusu sel altinda birakilabilirdi.
    if (await this.isWithinResendCooldown(user.id)) {
      return;
    }

    await this.issueAndSendVerification(user, ctx);
  }

  private async issueAndSendVerification(
    user: UserAccount,
    ctx: RequestContext,
  ): Promise<void> {
    const { token } = await this.prisma.$transaction((tx) =>
      this.tokenService.issue(tx, user.id, ctx),
    );

    await this.mailProducer.enqueueVerifyEmail({
      to: user.email,
      firstName: user.firstName,
      locale: user.locale || DEFAULT_LOCALE,
      verificationUrl: this.buildVerificationUrl(token),
      ttlHours: this.security.emailVerificationTtlHours,
    });
  }

  private async isWithinResendCooldown(userId: string): Promise<boolean> {
    const lastIssuedAt = await this.tokenService.lastIssuedAt(userId);

    if (lastIssuedAt === null) {
      return false;
    }

    const elapsedSeconds = (Date.now() - lastIssuedAt.getTime()) / 1000;

    return elapsedSeconds < this.security.emailResendCooldownSeconds;
  }

  private buildVerificationUrl(token: string): string {
    return `${this.appSettings.frontendUrl}/verify-email?token=${token}`;
  }

  private tokenErrorKey(
    status: 'not_found' | 'expired' | 'already_used',
  ): string {
    switch (status) {
      case 'expired':
        return 'TOKEN_EXPIRED';
      case 'already_used':
        return 'TOKEN_ALREADY_USED';
      default:
        return 'TOKEN_INVALID';
    }
  }
}
