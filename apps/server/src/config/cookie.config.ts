import { registerAs } from '@nestjs/config';
import { CookieOptions } from 'express';

const isProduction = process.env.NODE_ENV === 'production';

export const REFRESH_TOKEN_COOKIE_NAME = isProduction
  ? '__Host-refreshToken'
  : 'refreshToken';

export default registerAs(
  'cookie',
  (): CookieOptions => ({
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge:
      Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30) *
      24 *
      60 *
      60 *
      1000,
    path: isProduction ? '/' : '/api/auth',
    domain: isProduction ? undefined : process.env.COOKIE_DOMAIN,
  }),
);
