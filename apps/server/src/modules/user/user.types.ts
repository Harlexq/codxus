import { JobTitle, UserStatus } from '@app/generated/prisma/enums';

/**
 * Servis katmaninin disariya verdigi kullanici gorunumu.
 *
 * Prisma'nin User modeli DEGIL: passwordHash gibi alanlar bu tipte hic
 * bulunmuyor, dolayisiyla yanlislikla response'a tasinmasi mumkun degil.
 * Repository de zaten yalnizca bu alanlari select ediyor.
 */
export interface UserAccount {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  locale: string;
  status: UserStatus;
  emailVerifiedAt: Date | null;
}

export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  jobTitle: JobTitle | null;
  acceptedTermsAt: Date;
  acceptedTermsVersion: string;
  acceptedPrivacyAt: Date;
  acceptedPrivacyVersion: string;
  registrationIp: string | null;
}
