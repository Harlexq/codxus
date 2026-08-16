import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

import { RequestContext } from '@app/common/context/request-context.interface';
import {
  emptyToNull,
  generateToken,
  hashToken,
} from '@app/common/utils/crypto.util';
import securityConfig from '@app/config/security.config';
import { PrismaService } from '@app/database/prisma.service';
import { Prisma } from '@app/generated/prisma/client';

export interface IssuedToken {
  /** Ham token — YALNIZCA maile konur, DB'ye asla yazilmaz. */
  token: string;
  expiresAt: Date;
}

export type ConsumeResult =
  | { status: 'valid'; userId: string }
  | { status: 'not_found' }
  | { status: 'expired' }
  | { status: 'already_used' };

const USER_AGENT_MAX_LENGTH = 512;

@Injectable()
export class EmailVerificationTokenService {
  constructor(
    @Inject(securityConfig.KEY)
    private readonly config: ConfigType<typeof securityConfig>,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Yeni dogrulama token'i uretir ve kullanicinin acik token'larini kapatir.
   *
   * Tek kullanimlik + tek gecerli token kurali: kullanici "tekrar gonder"
   * dediginde eski linkin calismaya devam etmesi, eski maile erisen birine
   * hesabi dogrulama imkani birakirdi.
   */
  async issue(
    tx: Prisma.TransactionClient,
    userId: string,
    ctx: RequestContext,
  ): Promise<IssuedToken> {
    const token = generateToken();
    const expiresAt = new Date(
      Date.now() + this.config.emailVerificationTtlHours * 60 * 60 * 1000,
    );

    await tx.emailVerificationToken.updateMany({
      where: { userId, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    await tx.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: hashToken(token),
        expiresAt,
        requestIp: emptyToNull(ctx.ip),
        userAgent: emptyToNull(ctx.userAgent)?.slice(0, USER_AGENT_MAX_LENGTH),
      },
    });

    return { token, expiresAt };
  }

  /**
   * Token'i dogrular ve ayni islemde tuketir.
   *
   * Tuketme updateMany + "consumedAt: null" kosuluyla yapiliyor: iki es
   * zamanli istek (kullanicinin linke cift tiklamasi) geldiginde yalnizca
   * biri count=1 alir, digeri already_used doner. Once oku-sonra-yaz
   * yapsaydik ikisi de basarili olurdu.
   */
  async consume(
    tx: Prisma.TransactionClient,
    token: string,
  ): Promise<ConsumeResult> {
    // Ham token yerine hash'i ile ariyoruz. Kolon unique oldugu icin tek
    // indeks aramasi; uygulama icinde string karsilastirmasi olmadigindan
    // timing sizintisi da yok.
    const record = await tx.emailVerificationToken.findUnique({
      where: { tokenHash: hashToken(token) },
      select: { id: true, userId: true, expiresAt: true, consumedAt: true },
    });

    if (record === null) {
      return { status: 'not_found' };
    }

    if (record.consumedAt !== null) {
      return { status: 'already_used' };
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      return { status: 'expired' };
    }

    const claimed = await tx.emailVerificationToken.updateMany({
      where: { id: record.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    if (claimed.count === 0) {
      return { status: 'already_used' };
    }

    return { status: 'valid', userId: record.userId };
  }

  /** Yeniden gonderme cooldown'u icin: son token ne zaman uretildi. */
  async lastIssuedAt(userId: string): Promise<Date | null> {
    const latest = await this.prisma.emailVerificationToken.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    return latest?.createdAt ?? null;
  }
}
