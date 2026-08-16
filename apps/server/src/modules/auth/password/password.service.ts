import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import * as argon2 from 'argon2';
import { I18nService } from 'nestjs-i18n';

import { PASSWORD_RULES } from '@app/common/constants/password.constant';
import securityConfig from '@app/config/security.config';
import { HibpService } from '@app/providers/hibp/hibp.service';

import { PASSWORD_BLACKLIST } from '../security/password-blacklist';

export interface PasswordOwnerContext {
  email: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class PasswordService {
  constructor(
    @Inject(securityConfig.KEY)
    private readonly config: ConfigType<typeof securityConfig>,
    private readonly i18n: I18nService,
    private readonly hibpService: HibpService,
  ) {}

  /**
   * Politika kontrolu. Uzunluk DTO'da dogrulanir; burasi icerik kontrolu.
   *
   * Kayit akisinda e-posta VARLIGI KONTROL EDILMEDEN once cagrilmali:
   * aksi halde zayif bir sifre yeni e-postada 400, kayitli e-postada 201
   * donerdi ve bu tek basina bir user-enumeration oracle'i olurdu.
   */
  async validate(password: string, owner: PasswordOwnerContext): Promise<void> {
    const normalized = password.toLowerCase();

    const emailLocalPart = owner.email.split('@')[0]?.toLowerCase();

    if (
      emailLocalPart !== undefined &&
      emailLocalPart.length >= PASSWORD_RULES.MIN_NAME_LENGTH_FOR_CONTAINMENT &&
      normalized.includes(emailLocalPart)
    ) {
      throw new BadRequestException(
        this.i18n.t('auth.PASSWORD_CONTAINS_EMAIL'),
      );
    }

    if (
      this.containsName(normalized, owner.firstName) ||
      this.containsName(normalized, owner.lastName)
    ) {
      throw new BadRequestException(this.i18n.t('auth.PASSWORD_CONTAINS_NAME'));
    }

    if (PASSWORD_BLACKLIST.has(normalized.trim())) {
      throw new BadRequestException(this.i18n.t('auth.PASSWORD_BLACKLISTED'));
    }

    // HIBP erisilemezse fail-open doner (HibpService icinde loglanir):
    // dis servisin kesintisi kayit akisini durdurmamali.
    if (await this.hibpService.isPwned(password)) {
      throw new BadRequestException(this.i18n.t('auth.PASSWORD_PWNED'));
    }
  }

  async hash(password: string): Promise<string> {
    return argon2.hash(password, {
      // argon2id: argon2i'nin yan kanal direncini ve argon2d'nin GPU
      // direncini birlestirir; OWASP'in onerdigi varyant.
      type: argon2.argon2id,
      memoryCost: this.config.argon2.memoryCost,
      timeCost: this.config.argon2.timeCost,
      parallelism: this.config.argon2.parallelism,
    });
  }

  async verify(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      // Bozuk/eski format hash: dogrulama basarisiz sayilir, patlamaz.
      return false;
    }
  }

  private containsName(normalizedPassword: string, name: string): boolean {
    const normalizedName = name.trim().toLowerCase();

    // Kisa isimler ("Ali", "Su") pek cok saglam parolanin icinde tesadufen
    // gecer; esik altinda kontrol etmiyoruz.
    if (
      normalizedName.length < PASSWORD_RULES.MIN_NAME_LENGTH_FOR_CONTAINMENT
    ) {
      return false;
    }

    return normalizedPassword.includes(normalizedName);
  }
}
