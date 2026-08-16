import { registerAs } from '@nestjs/config';

export interface AppConfig {
  frontendUrl: string;
}

export default registerAs(
  'app',
  (): AppConfig => ({
    // Mail'lerdeki linklerin tabani. Sunucunun kendi adresi degil,
    // kullanicinin tarayicida acacagi frontend adresi.
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3001',
  }),
);
