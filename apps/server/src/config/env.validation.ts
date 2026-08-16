import Joi from 'joi';

export const envValidationSchema = Joi.object({
  // --- Sunucu ---
  NODE_ENV: Joi.string().valid('test', 'development', 'production').required(),
  SERVER_PORT: Joi.number().integer().min(1).max(65535).required(),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('info'),
  // Dogrulama linkinin tabani: ${FRONTEND_URL}/verify-email?token=...
  FRONTEND_URL: Joi.string().uri().required(),
  // Virgulle ayrik origin whitelist'i. "*" bilerek desteklenmiyor.
  CORS_ORIGINS: Joi.string().required(),

  // --- Veritabani ---
  DATABASE_URL: Joi.string().required(),

  // --- Redis: cache + rate limit sayaclari + mail kuyrugu ---
  REDIS_URL: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .required(),

  // --- Mail ---
  MAIL_HOST: Joi.string().required(),
  MAIL_PORT: Joi.number().integer().min(1).max(65535).required(),
  MAIL_SECURE: Joi.boolean().default(false),
  MAIL_USER: Joi.string().allow('').default(''),
  MAIL_PASSWORD: Joi.string().allow('').default(''),
  MAIL_FROM_ADDRESS: Joi.string().email().required(),
  MAIL_FROM_NAME: Joi.string().default('Codxus'),

  // --- Guvenlik ---
  // OWASP asgarisi: m=19 MiB, t=2, p=1.
  ARGON2_MEMORY_COST: Joi.number().integer().min(8192).default(19456),
  ARGON2_TIME_COST: Joi.number().integer().min(2).default(2),
  ARGON2_PARALLELISM: Joi.number().integer().min(1).default(1),
  EMAIL_VERIFICATION_TTL_HOURS: Joi.number().integer().min(1).default(24),
  EMAIL_RESEND_COOLDOWN_SECONDS: Joi.number().integer().min(0).default(60),
  HIBP_TIMEOUT_MS: Joi.number().integer().min(500).default(3000),
  // Kullanicinin kabul ettigi sozlesme surumu; DB'ye bu deger yazilir.
  TERMS_VERSION: Joi.string().default('v1'),

  // --- Sonraki gorev (login/session) icin ayrilmis ---
  REFRESH_TOKEN_EXPIRES_DAYS: Joi.number().integer().min(1).default(30),
  COOKIE_DOMAIN: Joi.string().allow('').optional(),
}).options({
  allowUnknown: true,
  // Tum eksik degiskenler tek seferde raporlansin; teker teker kesfetmek
  // yerine hepsini bir arada gorursun.
  abortEarly: false,
});
