import { registerAs } from '@nestjs/config';

export interface SecurityConfig {
  argon2: {
    memoryCost: number;
    timeCost: number;
    parallelism: number;
  };
  emailVerificationTtlHours: number;
  emailResendCooldownSeconds: number;
  termsVersion: string;
  privacyVersion: string;
}

export default registerAs(
  'security',
  (): SecurityConfig => ({
    // OWASP asgarisi: m=19 MiB, t=2, p=1. Testte bilerek dusuruluyor
    // (.env.test), cunku orada guvenlik degil hiz onemli.
    argon2: {
      memoryCost: Number(process.env.ARGON2_MEMORY_COST ?? 19456),
      timeCost: Number(process.env.ARGON2_TIME_COST ?? 2),
      parallelism: Number(process.env.ARGON2_PARALLELISM ?? 1),
    },
    emailVerificationTtlHours: Number(
      process.env.EMAIL_VERIFICATION_TTL_HOURS ?? 24,
    ),
    emailResendCooldownSeconds: Number(
      process.env.EMAIL_RESEND_COOLDOWN_SECONDS ?? 60,
    ),
    termsVersion: process.env.TERMS_VERSION ?? 'v1',
    privacyVersion: process.env.PRIVACY_VERSION ?? 'v1',
  }),
);
