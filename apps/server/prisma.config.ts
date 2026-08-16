import { config as dotenvConfig } from 'dotenv';
import { resolve } from 'path';
import { defineConfig } from 'prisma/config';

const env = process.env.NODE_ENV ?? 'development';
dotenvConfig({ path: resolve(__dirname, '../../', `.env.${env}`) });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    `DATABASE_URL tanimli degil (.env.${env} dosyasindan okunmaya calisildi).`,
  );
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});
