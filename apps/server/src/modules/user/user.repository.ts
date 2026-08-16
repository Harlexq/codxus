import { Injectable } from '@nestjs/common';

import { PrismaService } from '@app/database/prisma.service';
import { Prisma } from '@app/generated/prisma/client';
import { UserStatus } from '@app/generated/prisma/enums';

import { CreateUserData, UserAccount } from './user.types';

/**
 * passwordHash bu select'te YOK ve hicbir metot onu dondurmuyor.
 * Brief Bolum 6'daki "passwordHash hicbir response'a sizmasin" garantisi
 * @Exclude() gibi calisma zamani filtresine degil, buna dayaniyor: alan
 * hic cekilmediginden sizmasi mumkun degil, unutulursa da TIP HATASI verir.
 */
const USER_ACCOUNT_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  locale: true,
  status: true,
  emailVerifiedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Soft-delete edilmis kullanicilar donmez: silinmis bir hesabin e-postasi
   * "kayitli" sayilmamali.
   */
  async findActiveByEmail(email: string): Promise<UserAccount | null> {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      select: USER_ACCOUNT_SELECT,
    });
  }

  // tx parametresi: cagiran taraf islemi bir transaction icinde yurutmek
  // istedigi icin PrismaService yerine transaction client'i aliyoruz.
  // Boylece kullanici ve dogrulama token'i ya birlikte yazilir ya hic.
  async create(
    tx: Prisma.TransactionClient,
    data: CreateUserData,
  ): Promise<UserAccount> {
    return tx.user.create({
      data,
      select: USER_ACCOUNT_SELECT,
    });
  }

  /** Guncellenmis hesabi doner: hos geldin maili icin ad/e-posta/dil lazim. */
  async markEmailVerified(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<UserAccount> {
    return tx.user.update({
      where: { id: userId },
      data: {
        emailVerifiedAt: new Date(),
        status: UserStatus.ACTIVE,
      },
      select: USER_ACCOUNT_SELECT,
    });
  }
}
