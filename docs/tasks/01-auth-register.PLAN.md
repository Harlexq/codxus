# PLAN: Auth — Kayıt (Register) Akışı

> [01-auth-register.md](./01-auth-register.md) brief'ine karşılık üretilen uygulama planıdır.
> **Kod yazılmadan önce onaylanması gerekir.** Bölüm 9'daki 7 karar cevaplanmadan 2. parçaya geçilmez.

---

## 0. Onaylanmış kararlar

Brief'in Bölüm 1'i boştu; sorular soruldu ve şu cevaplar alındı:

| Konu | Karar |
|---|---|
| Redis | **Kullanılacak** — docker ile lokal. Cache + rate limit deposu + mail kuyruğu |
| Mail | **Mailpit (docker)** lokalde, prod'da SMTP env'den. Nodemailer + MJML |
| User enumeration | **Generic 201 + uyarı maili.** `/auth/users` hiçbir koşulda 409 dönmez |
| Mevcut yarım kod | **Sıfırdan yazılacak**, migration'lar sıfırlanacak |

Repodan doğrudan tespit edilenler (sorulmadı):

| Konu | Değer |
|---|---|
| Monorepo | Turborepo 2.9 + pnpm workspaces |
| Paket yöneticisi | pnpm 11.2.1 |
| Node | v24.13.0 |
| Backend yolu | `apps/server` (Nest 11, scaffold edilmiş) |
| Frontend | `apps/client` (Next 16, port **3001**) — bu görevde dokunulmayacak |
| Ortak paket | `packages/shared` — `StandardResponse<T>` / `ErrorResponse` tipleri burada |
| Postgres | `localhost:5432/codxus_dev`, `.env.development`'ta tanımlı (docker-compose **yok**, eklenecek) |
| ORM | Prisma 7 + `@prisma/adapter-pg`, `prisma.config.ts` env'i kökten okuyor |

---

## 1. Mevcut kodun denetimi

Sıfırdan yazma kararı alındı; gerekçeler kayda geçsin diye tespitler:

### Derlenmeyen dosyalar

- `src/modules/auth/auth.controller.ts` — `@Throttle`, `AuthThrottlerGuard`, `CsrfGuard` import edilmemiş; son ikisi repoda yok.
- `src/modules/auth/auth.service.ts` — `TIME_CONSTANTS` import yok, `acceptedTermsVersion` tanımsız değişkene atanıyor, `this.prisma` / `this.emailProducer` / `this.eventEmitter` constructor'da yok, `passwordService.validate` 3 parametre isterken 2 ile çağrılıyor.
- `src/modules/auth/password/password.service.ts` — `bcrypt` import ediliyor ama `package.json`'da **bcrypt yok**.
- `src/providers/cache/cache.module.ts` — `@nestjs/cache-manager` ve `@tirke/node-cache-manager-ioredis` import ediliyor, ikisi de kurulu değil.

### Yapısal hatalar

| # | Sorun | Etki |
|---|---|---|
| 1 | `src/modules/` ve `src/domains/` paralel duruyor; `app.module.ts` yalnız `AccountModule`'ü alıyor | `AuthModule` grafiğe `AccountModule` üzerinden bağlı ama `UserModule` hiç bağlı değil |
| 2 | `nest-cli.json` assets `outDir: "dist/apps/api"` | Bu app'in outDir'ı `./dist`. i18n dosyaları prod build'de yanlış yere kopyalanıyor → çeviriler bulunamaz |
| 3 | `main.ts`'te helmet, CORS, `ValidationPipe`, `x-powered-by` kapatma, shutdown hooks yok | Brief Bölüm 6 gereksinimlerinin hiçbiri karşılanmıyor |
| 4 | `useGlobalFilters(new AllExceptionsFilter())` elle instantiate | Filter DI alamaz → i18n inject edilemez, hata mesajları çevrilemez |
| 5 | `AllExceptionsFilter` `@Catch(HttpException)` | Beklenmeyen hatalar (Prisma, TypeError) yakalanmıyor, Nest'in default filter'ına düşüp envelope **dışı** JSON dönüyor |
| 6 | `tsconfig.json`: `strict` yok, `noImplicitAny: false`, `strictBindCallApply: false`, `noUncheckedIndexedAccess` yok | Brief Bölüm 7 ile doğrudan çelişiyor |
| 7 | `paths` alias tanımlı değil, jest `moduleNameMapper` yok | `src/...` importları testte çözülmez |
| 8 | `@@unique([email, deletedAt])` | Postgres'te NULL'lar birbirinden farklı sayılır → `deletedAt = NULL` olan **aynı e-postalı iki aktif kullanıcı** yaratılabilir. Bu kısıt hiçbir şey korumuyor |
| 9 | `User.role` + `enum Role { ... OWNER }` | Brief madde 3.1/3.2: bu bir izin rolü değil, `jobTitle` olmalı. `OWNER` değeri ileriki membership sistemiyle çakışır |
| 10 | `providers/metrics/` | Brief kapsam-dışı listesinde: "Prometheus / Sentry / metrics" |
| 11 | `regex.constant.ts` içinde `FIRTNAME` yazım hatası | `REGEX.FIRSTNAME` çağrısı `undefined` döner, `@Matches(undefined)` sessizce çalışır |
| 12 | E-posta token'ları `User` üzerinde ham metin olarak (`emailVerificationToken`) | Brief Bölüm 5: token DB'ye ham yazılmaz, ayrı tabloda SHA-256 hash'i tutulur |

### Kapsam dışı olduğu için silinecekler

`auth.controller.ts` içindeki `GET /auth/csrf`, `auth.service.ts` içindeki `generateCsrfToken`, şemadaki `Session`, `AuditLog`, `passwordHistory`, `failedLoginAttempts`, `lockUntil`, `lastLoginAt`, `lastActivityAt`, `tokenVersion`, `passwordReset*`, `emailChange*`, `avatarUrl`, `deactivatedAt` — hepsi sonraki görevlere ait. Şu an tablolarda yer kaplamaları migration borcundan başka bir şey değil.

`src/config/cookie.config.ts` **kalıyor** (bağımlılık gerektirmiyor, login görevinde kullanılacak).

### Güvenlik notu (kapsam dışı ama söylenmeli)

`.env.development`, `.env.test`, `.env.production` dosyaları **git'te takip ediliyor** ve içlerinde DB parolası var (`postgres:postgres123`). Lokal dev parolası olduğu için acil değil, ama `.env.production` bir gün gerçek değerle dolarsa geçmişe sızar. Bölüm 9 dışında bırakıyorum çünkü tercih meselesi — istersen `.gitignore`'a alırız.

---

## 2. Önerilen klasör yapısı

Ayrım kuralı: **`core/` = DI'a bağlanan, uygulama çapında tek örnek altyapı. `common/` = DI'sız saf yardımcılar. `providers/` = dış dünya adaptörleri. `modules/` = iş alanları.**

```
apps/server/
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/                    ← sıfırlanıp tek init migration
├─ src/
│  ├─ main.ts
│  ├─ app.module.ts
│  │
│  ├─ config/                        ← env şeması + namespace'li config'ler
│  │  ├─ env.validation.ts
│  │  ├─ app.config.ts               (port, frontendUrl, corsOrigins)
│  │  ├─ cookie.config.ts            (mevcut, dokunulmuyor)
│  │  ├─ mail.config.ts
│  │  ├─ redis.config.ts
│  │  ├─ security.config.ts          (argon2 parametreleri, token TTL)
│  │  └─ swagger.config.ts
│  │
│  ├─ core/                          ← global altyapı (DI'lı)
│  │  ├─ logger/                     (mevcut winston modülü)
│  │  ├─ filters/all-exceptions.filter.ts
│  │  ├─ interceptors/
│  │  │  ├─ response.interceptor.ts  ← common/'dan taşınıyor
│  │  │  └─ logging.interceptor.ts   ← common/'dan taşınıyor
│  │  ├─ middleware/request-id.middleware.ts   ← common/'dan taşınıyor
│  │  └─ swagger/api-standard-response.decorator.ts
│  │
│  ├─ common/                        ← saf, DI'sız
│  │  ├─ constants/  (password, token, cache, regex)
│  │  ├─ context/    (request-context.interface.ts)
│  │  ├─ decorators/ (match, transform, req-context)
│  │  ├─ types/      (express.d.ts)
│  │  └─ utils/      (crypto.util.ts)
│  │
│  ├─ database/
│  │  ├─ prisma.module.ts
│  │  └─ prisma.service.ts
│  │
│  ├─ providers/                     ← dış dünya
│  │  ├─ cache/     (cache.module.ts, cache.service.ts)
│  │  ├─ hibp/      (hibp.module.ts, hibp.service.ts)
│  │  ├─ redis/     (redis.module.ts — ioredis tek instance, paylaşılan)
│  │  └─ mail/
│  │     ├─ mail.module.ts
│  │     ├─ mail.service.ts          (nodemailer transport)
│  │     ├─ mail.producer.ts         (kuyruğa iş atar)
│  │     ├─ mail.processor.ts        (BullMQ worker)
│  │     ├─ mail.types.ts
│  │     └─ templates/
│  │        ├─ src/                  (*.mjml — kaynak)
│  │        └─ compiled/             (*.html — build çıktısı, gitignore)
│  │
│  ├─ modules/
│  │  ├─ auth/
│  │  │  ├─ auth.module.ts
│  │  │  ├─ auth.controller.ts
│  │  │  ├─ auth.service.ts
│  │  │  ├─ auth.mapper.ts
│  │  │  ├─ dto/
│  │  │  │  ├─ create-user.dto.ts
│  │  │  │  ├─ verify-email.dto.ts
│  │  │  │  ├─ resend-verification.dto.ts
│  │  │  │  └─ response/register-response.dto.ts
│  │  │  ├─ password/password.service.ts
│  │  │  ├─ security/password-blacklist.ts
│  │  │  ├─ token/email-verification-token.service.ts
│  │  │  ├─ guards/
│  │  │  │  ├─ ip-throttler.guard.ts
│  │  │  │  └─ email-throttler.guard.ts
│  │  │  └─ auth.service.spec.ts
│  │  └─ user/
│  │     ├─ user.module.ts
│  │     ├─ user.repository.ts
│  │     └─ user.types.ts            (servis→controller arası kendi tiplerimiz)
│  │
│  ├─ i18n/tr/  (auth.json, validation.json, mail.json)
│  └─ generated/prisma/              (gitignore'da zaten var)
│
├─ scripts/build-templates.ts        (MJML → HTML)
└─ prisma.config.ts

infra/
└─ docker-compose.yml                (postgres + redis + mailpit)
```

**Silinecek:** `src/domains/`, `src/providers/metrics/`, `src/modules/user/user.controller.ts`, `src/modules/user/user.service.ts` (boş dosya), `src/modules/auth/dto/response/auth-response.dto.ts` (login'e ait).

**Açılmayacak:** `guards/` (global), `strategies/`, `events/`, `queues/`, `consumers/`, `producers/`, `storage/`, `health/`, `pipes/`, `interfaces/` — hiçbirinin bu görevde içeriği yok. `auth/guards/` var çünkü içine gerçekten 2 dosya giriyor.

### Path alias

`tsconfig.json`'a `"@app/*": ["src/*"]`, jest'e karşılığı `moduleNameMapper`. Mevcut `src/...` importları `@app/...` olur.

---

## 3. Prisma veri modeli

```prisma
enum UserStatus {
  PENDING_VERIFICATION
  ACTIVE
  SUSPENDED
  DELETED
}

enum JobTitle {
  DEVELOPER
  DESIGNER
  PROJECT_MANAGER
  FREELANCER
  FOUNDER
}

model User {
  id String @id @default(uuid(7)) @db.Uuid

  email           String    @unique @db.VarChar(254)
  emailVerifiedAt DateTime?

  firstName String @db.VarChar(64)
  lastName  String @db.VarChar(64)

  passwordHash String     @db.VarChar(255)
  jobTitle     JobTitle?
  status       UserStatus @default(PENDING_VERIFICATION)
  locale       String     @default("tr") @db.VarChar(5)

  acceptedTermsAt      DateTime
  acceptedTermsVersion String   @db.VarChar(16)

  registrationIp String? @db.VarChar(45)

  emailVerificationTokens EmailVerificationToken[]

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  @@index([deletedAt])
  @@index([status])
}

model EmailVerificationToken {
  id String @id @default(uuid(7)) @db.Uuid

  userId String @db.Uuid
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  tokenHash  String    @unique @db.VarChar(64)
  expiresAt  DateTime
  consumedAt DateTime?

  requestIp String? @db.VarChar(45)
  userAgent String? @db.VarChar(512)

  createdAt DateTime @default(now())

  @@index([userId, consumedAt])
  @@index([expiresAt])
}
```

### Alan gerekçeleri

**`id` — `uuid(7)`** (Karar 1'de tartışılıyor): v7 zamana göre monoton artar, B-tree index'te sayfa bölünmesi yaratmaz (uuid v4'ün en büyük derdi). Postgres'in native `uuid` tipi 16 byte; cuid ise 25 karakterlik `text`. Dezavantajı: ID oluşturulma zamanını sızdırır — bir proje yönetim aracında kullanıcı ID'si için önemsiz.

**`email` — app-level normalize, citext değil.** `citext` bir Postgres eklentisi; `CREATE EXTENSION` yetkisi ister, bazı managed DB'lerde kapalıdır, ve Unicode normalizasyonunu (ör. Türkçe İ/ı) zaten çözmez. Bunun yerine DTO seviyesinde `@TrimLower()` ile normalize edip **her zaman normalize halde** yazıyoruz. Tek kaynak uygulama, davranış deterministik ve taşınabilir.

**`@unique` + partial index.** Düz `@unique`, soft-delete edilmiş kullanıcının e-postasını sonsuza dek bloke eder. `@@unique([email, deletedAt])` ise Bölüm 1 madde 8'deki NULL problemi yüzünden hiçbir şey korumaz. Doğru çözüm elle yazılan partial unique index (Karar 4):

```sql
CREATE UNIQUE INDEX "users_email_active_key" ON "User"("email") WHERE "deletedAt" IS NULL;
```

**`emailVerifiedAt` nullable + ayrı `status`.** İkisi ayrı bilgi: `emailVerifiedAt` bir olay zamanı, `status` bir yaşam döngüsü durumu. Kullanıcı doğrulanmış (`emailVerifiedAt` dolu) ama `SUSPENDED` olabilir.

**`locale`** — i18n'in kullanıcı bazlı çalışması için. Mail dili buradan seçilecek; şimdilik hep `tr`.

**`acceptedTermsAt` / `acceptedTermsVersion`** — Karar 2'ye bağlı. KVKK açısından "hangi kullanıcı, hangi metnin hangi sürümünü, ne zaman kabul etti" sorusunun cevabı sonradan üretilemez.

**`registrationIp`** — kötüye kullanım analizi. `@db.Inet` yerine `VarChar(45)` çünkü `ReqContext` IP bulunamadığında `''` döndürüyor ve `inet` tipi boş string'i reddeder; string olarak tutup boşu `null`'a çeviriyoruz (IPv6 max 45 karakter).

**`tokenHash` — SHA-256, argon2 değil.** Token 256-bit rastgele; brute-force edilebilir bir entropi yok, dolayısıyla yavaş hash gereksiz. Hızlı hash aynı zamanda `findUnique` ile tek sorguda bulmayı sağlıyor.

**Ayrı `EmailVerificationToken` tablosu** — `User` üzerinde tek kolon tutulursa "yeni token istenince eskiler invalidate" (brief Bölüm 6) denetlenemez ve `requestIp`/`userAgent` audit'i kaybolur.

### Önerilen ama şimdi eklenmeyen tablolar

- **`AuditLog`** — `REGISTER`, `EMAIL_VERIFIED`, `VERIFICATION_RESENT` olaylarını `userId + action + ip + userAgent + requestId + meta` ile tutar. Login/session görevinde `LOGIN_FAILED` ve şüpheli giriş tespiti için zaten gerekecek; o görevde eklenmesini öneriyorum. Şimdilik bu olaylar structured log'a yazılacak.
- **`Session`** — sonraki görev.
- **`TermsDocument`** — sözleşme sürümlerini DB'de tutmak. Şimdilik `TERMS_VERSION` env değişkeni yeterli.

---

## 4. Endpoint sözleşmeleri

Hepsi `/api` global prefix'i altında, hepsi `StandardResponse<T>` zarfıyla döner.

### `POST /api/auth/users` — Kayıt

```jsonc
// Request
{
  "firstName": "Serhan",
  "lastName": "Bakır",
  "email": "serhan@example.com",
  "password": "kirmizi-bisiklet-2026",
  "passwordConfirm": "kirmizi-bisiklet-2026",
  "jobTitle": "FOUNDER",        // opsiyonel
  "acceptTerms": true            // Karar 2'ye bağlı
}
```

```jsonc
// 201 — e-posta ister yeni ister kayıtlı olsun, GÖVDE AYNI
{
  "success": true,
  "statusCode": 201,
  "data": { "verificationPending": true },
  "timestamp": "2026-08-16T12:00:00.000Z",
  "path": "/api/auth/users",
  "requestId": "..."
}
```

Servis içi üç dal, dışarıdan ayırt edilemez:

| Durum | Yapılan | Gönderilen mail |
|---|---|---|
| E-posta yeni | Kullanıcı + token oluşturulur | Doğrulama maili |
| E-posta kayıtlı, doğrulanmış | **Hiçbir yazma yapılmaz** | "Hesabınızla kayıt denendi" uyarı maili |
| E-posta kayıtlı, doğrulanmamış | Eski token'lar invalidate, yeni token | Doğrulama maili |

Üçüncü dalda **kullanıcı verileri güncellenmez** (Karar 7): aksi halde saldırgan, bekleyen bir kaydın şifresini ezebilir.

Zamanlama farkını kapatmak için üç dal da argon2 hash maliyetini ödemeli — kayıtlı e-posta dalında da bir kez hash alınır (sonuç atılır), yoksa yanıt süresi enumeration oracle'ı olur.

Hatalar: `400` validation, `429` rate limit. **`409` yok.**

### `POST /api/auth/email/verify` — Doğrulama

```jsonc
// Request
{ "token": "9xK3...43-karakter-base64url" }
// 200 → data: null
```

Token gövdede (query'de değil): query string sunucu erişim log'larına ve `Referer` header'ına düşer.

Hatalar: `400` `TOKEN_INVALID` / `TOKEN_EXPIRED` / `TOKEN_ALREADY_USED` (ayrı anahtarlar — frontend "süresi doldu" durumunda yeniden gönder butonu göstersin diye; enumeration açısından bilgi sızdırmıyor çünkü token zaten saldırganın elinde), `429`.

Başarıda tek transaction içinde: `consumedAt` set edilir, `emailVerifiedAt = now()`, `status = ACTIVE`, kullanıcının diğer tüm açık token'ları invalidate edilir.

### `POST /api/auth/email/resend` — Yeniden gönder

```jsonc
// Request
{ "email": "serhan@example.com" }
// 200 → data: null (kullanıcı yoksa da, zaten doğrulanmışsa da aynı yanıt)
```

Ek olarak DB seviyesinde 60 sn cooldown: son token'ın `createdAt`'i 60 sn'den yeniyse yeni mail gönderilmez, yanıt yine 200.

---

## 5. Güvenlik tasarımı

### Şifre

- **argon2id.** Parametreler OWASP asgarisi: `memoryCost: 19456` (19 MiB), `timeCost: 2`, `parallelism: 1`, env'den ayarlanabilir. bcrypt'i seçmiyoruz çünkü 72 byte'tan sonrasını sessizce kesiyor ve GPU'ya karşı argon2id kadar dirençli değil.
- Politika: **min 12, max 128 karakter.** Kompozisyon regex'i (büyük harf + rakam + sembol zorunluluğu) **kaldırılıyor** — NIST 800-63B bunu önermiyor; kullanıcıyı `Parola1!` gibi tahmin edilebilir kalıplara itiyor. Yerine: uzunluk + HIBP + lokal blacklist + e-posta/isim içermeme kontrolü.
- Şifre **trim edilmez** (baştaki/sondaki boşluk kullanıcının tercihidir).
- HIBP k-anonymity: SHA-1 prefix'i ile `api.pwnedpasswords.com/range/`, `Add-Padding: true`. Cevap Redis'te 1 saat cache'lenir. Timeout 3 sn; hata/timeout durumunda **fail-open** + `warn` log (brief gereği).

### Token

- `randomBytes(32).toString('base64url')` → 43 karakter, URL'de encode gerektirmez. (Mevcut `crypto.util.ts` `hex` üretiyor, `base64url`'e çevrilecek.)
- DB'de yalnız `sha256(token)`.
- TTL 24 saat, tek kullanımlık, yeni token üretilince eskiler `consumedAt = now()` ile kapatılır.
- Doğrulama `findUnique({ tokenHash })` ile yapılır — uygulama içinde string karşılaştırması olmadığı için timing sızıntısı yok. `crypto.timingSafeEqual` yalnız ek bir karşılaştırma gerekirse kullanılacak.

### Rate limit

`@nestjs/throttler` + Redis storage. İki boyut ayrı ayrı:

| Endpoint | IP bazlı | E-posta bazlı |
|---|---|---|
| `POST /auth/users` | 3 / 60 sn | 3 / 60 dk |
| `POST /auth/email/verify` | 10 / 60 sn | — |
| `POST /auth/email/resend` | 2 / 120 sn | 2 / 120 sn |

`IpThrottlerGuard` varsayılan tracker'ı kullanır; `EmailThrottlerGuard` `getTracker()`'ı override edip `email:<normalize edilmiş e-posta>` döndürür. İkisi endpoint'te birlikte `@UseGuards(...)` ile uygulanır. Sayaçlar Redis'te olduğu için restart'ta sıfırlanmaz ve çoklu instance'ta ortaktır.

### HTTP sertleştirme

`helmet()`, `app.disable('x-powered-by')`, CORS whitelist `CORS_ORIGINS` env'inden (virgülle ayrık), `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` + `I18nValidationPipe`, `app.enableShutdownHooks()`.

### passwordHash sızıntısı

`UserRepository` metotları Prisma tipini değil, `src/modules/user/user.types.ts` içindeki kendi tiplerimizi döner ve `select` ile yalnız gereken kolonları çeker. Controller'a dönen her şey `auth.mapper.ts` içindeki explicit mapper'dan geçer. `@Exclude()` kullanılmıyor — bir `select` unutulduğunda `@Exclude` sessizce çalışır, mapper ise tip hatası verir.

### Mail

- Nodemailer, SMTP env'den. Lokalde Mailpit (`localhost:1025`, arayüz `localhost:8025`).
- Şablonlar MJML kaynağından **build zamanında** HTML'e derlenir (Karar 5), çalışma anında yalnız Handlebars interpolasyonu yapılır. Handlebars değişkenleri varsayılan olarak HTML-escape ediyor → kullanıcı adı üzerinden HTML injection kapalı.
- Gönderim BullMQ `mail` kuyruğuna atılır: `attempts: 5`, exponential backoff (2 sn'den başlar), `removeOnComplete: 100`. Request hiçbir koşulda SMTP'yi beklemez.
- Şablonlar (3 adet, Türkçe): `verify-email`, `account-exists` (enumeration karşılığı uyarı maili), `welcome` (doğrulama tamamlanınca).
- Doğrulama linki: `${FRONTEND_URL}/verify-email?token=<token>` → `http://localhost:3001/verify-email?token=...`

---

## 6. Altyapı

### `infra/docker-compose.yml`

| Servis | Image | Port | Not |
|---|---|---|---|
| postgres | `postgres:18-alpine` | 5432 | `.env.development`'taki kimlikle birebir |
| redis | `redis:8-alpine` | 6379 | AOF açık |
| mailpit | `axllent/mailpit` | 1025 / 8025 | SMTP + web arayüz |

### `.env.example` (yeni değişkenler)

```bash
# --- Sunucu ---
SERVER_PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
FRONTEND_URL=http://localhost:3001        # doğrulama linkinin tabanı
CORS_ORIGINS=http://localhost:3001        # virgülle ayrık whitelist

# --- Veritabanı ---
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/codxus_dev?schema=public

# --- Redis (cache + rate limit + kuyruk) ---
REDIS_URL=redis://localhost:6379

# --- Mail ---
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_SECURE=false
MAIL_USER=                                 # Mailpit'te boş
MAIL_PASSWORD=
MAIL_FROM_ADDRESS=noreply@codxus.com
MAIL_FROM_NAME=Codxus

# --- Güvenlik ---
ARGON2_MEMORY_COST=19456                   # KiB
ARGON2_TIME_COST=2
ARGON2_PARALLELISM=1
EMAIL_VERIFICATION_TTL_HOURS=24
EMAIL_RESEND_COOLDOWN_SECONDS=60
HIBP_TIMEOUT_MS=3000
TERMS_VERSION=v1                           # kabul edilen sözleşme sürümü
```

`REFRESH_TOKEN_EXPIRES_DAYS` mevcut haliyle kalıyor (login görevi kullanacak). Hepsi `env.validation.ts`'e Joi kuralıyla eklenir, `abortEarly: false` ile tüm eksikler tek seferde raporlanır.

---

## 7. Kurulacak paketler

`apps/server` altına. Sürümler Node 24 / Nest 11 ile uyumlu.

### dependencies

| Paket | Sürüm | Neden |
|---|---|---|
| `argon2` | ^0.44 | argon2id hash. Prebuilt binary'leri var, Windows'ta derleme gerektirmiyor |
| `@nestjs/throttler` | ^6.5 | Rate limit altyapısı |
| `@nest-lab/throttler-storage-redis` | ^1.2 | Sayaçları Redis'te tutar; restart'ta sıfırlanmaz, çok instance'ta ortak |
| `ioredis` | ^5.10 | Redis client. Throttler storage, cache ve BullMQ aynı bağlantı havuzunu kullanır |
| `@nestjs/bullmq` | ^11 | Mail kuyruğu için Nest entegrasyonu |
| `bullmq` | ^5.73 | Kuyruk motoru (retry, backoff, DLQ) |
| `nodemailer` | ^8 | SMTP gönderimi |
| `handlebars` | ^4.7 | Şablon değişkeni interpolasyonu + otomatik HTML escape |
| `helmet` | ^8.1 | Güvenlik header'ları |

### devDependencies

| Paket | Sürüm | Neden |
|---|---|---|
| `mjml` | ^4.18 | MJML→HTML derleme. **dev**, çünkü derleme build zamanında yapılıyor; runtime'da bu ~30 MB'lık paket taşınmıyor |
| `@types/mjml` | ^4.7 | Build script'i için tipler |
| `@types/nodemailer` | ^7 | Tipler |
| `jest-mock-extended` | ^4 | `PrismaService` ve repository mock'ları |

### Kurulmayanlar (ve nedeni)

- **`bcrypt`** — argon2id seçildi. Zaten import ediliyordu ama kurulu değildi; import kaldırılıyor.
- **`@nestjs/cache-manager` + `cache-manager` + `@tirke/node-cache-manager-ioredis`** — mevcut `CacheService` bu üçünü kullanıyor ama hiçbiri kurulu değil. Karar 6: bu katman yerine doğrudan `ioredis` üzerine ~40 satırlık `CacheService` yazılacak. Üç bağımlılık eksilir, tip kontrolü tam bizde olur, tek ihtiyacımız `get/set/del/delByPrefix`.
- **`@nestjs/event-emitter`** — BullMQ varken ikinci bir async mekanizma gereksiz.
- **`cookie-parser`** — bu görevde cookie okunmuyor (CSRF endpoint'i kapsam dışı). Login görevinde gelir.
- **`@nestjs/jwt`, `passport`, `passport-jwt`** — sonraki görev.
- **`sharp`, `@aws-sdk/*`, `otplib`, `qrcode`, `geoip-lite`, `ua-parser-js`, `@sentry/*`, `prom-client`, `@willsoto/nestjs-prometheus`, `@nestjs/terminus`, `@nestjs/schedule`, `multer`** — referans `package.json`'da vardı, bu görevin kapsamında hiçbirinin karşılığı yok.

---

## 8. Uygulama sırası

Her parça bittiğinde ayrı commit + push (Conventional Commits, mevcut konvansiyona uygun).

| # | Parça | Kapsam | Commit |
|---|---|---|---|
| 1 | **Temizlik + altyapı** | `domains/` ve `metrics/` sil, `core/`–`common/` ayrımı, tsconfig strict + path alias, jest moduleNameMapper, `nest-cli.json` assets düzelt, `main.ts` sertleştirme, `AllExceptionsFilter` `@Catch()` + DI, docker-compose, `.env.example` | `refactor(server): restructure app layout and harden bootstrap` |
| 2 | **Veri modeli** | Yeni `schema.prisma`, migration reset, partial unique index'li tek init migration | `feat(server): rewrite user schema with email verification tokens` |
| 3 | **Provider'lar** | `redis`, `cache` (ioredis üstü), `hibp`, `mail` (nodemailer + MJML + BullMQ + 3 şablon), `scripts/build-templates.ts` | `feat(server): add redis, cache and mail providers` |
| 4 | **Auth çekirdeği** | DTO'lar, `PasswordService` (argon2 + HIBP + blacklist), `EmailVerificationTokenService`, `UserRepository`, `AuthService` üç dalıyla, mapper, i18n anahtarları | `feat(server): implement registration and email verification` |
| 5 | **Controller + koruma** | 3 endpoint, throttler guard'ları, Swagger dekoratörleri | `feat(server): expose auth registration endpoints` |
| 6 | **Teslim** | `auth.service.spec.ts`, `email-verification-token.service.spec.ts`, curl reçetesi, sonraki adım notu | `test(server): add unit tests for registration flow` |

Nest'e özgü kısımlar (`APP_FILTER`/`APP_PIPE` provider'ları, `forRootAsync` + `useFactory` DI, `@Global()` modül scope'u, `OnModuleInit` lifecycle, param decorator'ların execution context'i) kod içinde kısa yorumlarla açıklanacak.

---

## 9. Senin kararına bıraktıklarım

### Karar 1 — Primary key tipi

| Seçenek | Artı | Eksi |
|---|---|---|
| **`uuid(7)` (önerim)** | Zamana göre sıralı → index locality; native `uuid` tipi 16 byte; standart, her araç okur | Oluşturulma zamanını sızdırır |
| `cuid()` | Kısa, URL dostu, çakışmasız | 25 karakter `text`; Postgres native tipi yok; Prisma'nın cuid v1'i |
| `uuid(4)` | Zaman sızdırmaz | Rastgele → B-tree sayfa bölünmesi, büyük tabloda yazma yavaşlar |

### Karar 2 — Sözleşme / KVKK onayı

| Seçenek | Sonuç |
|---|---|
| **Şimdi zorunlu (önerim)** | `acceptTerms: true` DTO'da zorunlu, DB'ye zaman + sürüm yazılır. Frontend'e **1 checkbox** eklenmesi gerekir (o değişikliği sen yaparsın, ben frontend'e dokunmuyorum) |
| Şimdi alan var, zorunlu değil | Kolonlar nullable açılır, sonra doldurulur. Mevcut kullanıcılar için onay kaydı hiç oluşmaz |
| Tamamen sonraya | En temiz kapsam, ama var olan kullanıcılara geriye dönük onay toplamak zorunda kalırsın |

### Karar 3 — Tablo/kolon adlandırma

| Seçenek | Sonuç |
|---|---|
| **snake_case + `@@map`/`@map` (önerim)** | `users`, `email_verification_tokens`, `password_hash`. Postgres konvansiyonu; ham SQL, migration ve BI araçlarında tırnak derdi yok. Migration'ları zaten sıfırlıyoruz — bunu yapmanın en ucuz anı |
| Prisma varsayılanı (mevcut) | `"User"`, `"emailVerifiedAt"` — ham SQL'de her yerde çift tırnak |

### Karar 4 — Soft delete + e-posta tekilliği

| Seçenek | Sonuç |
|---|---|
| **Partial unique index (önerim)** | `WHERE deletedAt IS NULL`. Silinen kullanıcının e-postası tekrar kullanılabilir, orijinal e-posta audit için okunabilir kalır. Prisma şemada ifade edemiyor → migration elle düzenlenir (tek satır, kalıcı) |
| Tombstone e-posta | Silerken e-posta `deleted_<id>@codxus.invalid` yapılır. Şema saf kalır ama orijinal e-posta kaybolur |

### Karar 5 — MJML derleme zamanı

| Seçenek | Sonuç |
|---|---|
| **Build zamanı (önerim)** | `pnpm mail:build` ile `.mjml → .html`. mjml devDependency olur, prod imajı ~30 MB küçülür, açılış anında derleme maliyeti yok |
| Çalışma zamanı | Şablon değişince build gerekmez; ama mjml prod bağımlılığı olur ve ilk mailde derleme gecikmesi yaşanır |

### Karar 6 — Cache katmanı

| Seçenek | Sonuç |
|---|---|
| **Düz ioredis üstü CacheService (önerim)** | 3 bağımlılık eksi, tip kontrolü tam bizde, ihtiyacımız zaten `get/set/del/delByPrefix` |
| `@nestjs/cache-manager` + store | Standart Nest arayüzü, `@Cacheable` benzeri desenler; ama cache-manager v7'nin ioredis store'u ekosistemde oynak |

### Karar 7 — Doğrulanmamış kayda tekrar kayıt denemesi

| Seçenek | Sonuç |
|---|---|
| **Dokunma, sadece yeni token gönder (önerim)** | Saldırgan bekleyen bir kaydın şifresini/adını ezemez. Kullanıcı yanlış şifre girdiyse çözüm şifre sıfırlama akışıdır (sonraki görev) |
| Verileri güncelle | "Kaydımı yeniden yapayım" UX'i akıcı olur; bedeli, doğrulanmamış hesabın hesap devralmaya açık olması |

---

## 10. Teslim listesi

Uygulama bittiğinde brief Bölüm 9 gereği verilecekler:

1. `.env.example` — her değişken açıklamalı (Bölüm 6'daki taslak)
2. `infra/docker-compose.yml` + tek komutluk kaldırma talimatı
3. Uçtan uca curl reçetesi: kayıt → Mailpit'ten token → doğrulama → tekrar gönder
4. `auth.service.spec.ts` (kayıt: üç dal) ve `email-verification-token.service.spec.ts` (süresi dolmuş / kullanılmış / geçerli token) — devamını sen yazacaksın
5. Login/session görevine devir notu

---

## 11. Sonraki adım (login/session) için ön not

1. **Hazır:** `User.status` + `emailVerifiedAt` — login guard'ı "doğrulanmamış kullanıcı giremez" kuralını doğrudan uygulayabilir.
2. **Hazır:** `cookie.config.ts` (`__Host-` prefix'i, `sameSite: strict`, prod'da `secure`) ve Redis — refresh token rotasyonu ve blacklist için altyapı ayakta.
3. **Eklenecek:** `Session` modeli (`refreshTokenHash`, `userAgent`, `ip`, `revokedAt`) ve `User.tokenVersion` — bilerek şimdi eklenmedi, kullanılmayan kolon bırakmamak için.
4. **Eklenecek:** `AuditLog` tablosu — `LOGIN_FAILED` ve şüpheli giriş tespiti onsuz yapılamaz. Register olayları o zaman geriye dönük olarak da yazılabilir.
5. **Karar bekleyecek:** CSRF stratejisi. Refresh token cookie'de tutulacaksa double-submit cookie veya `SameSite=Strict` + origin kontrolü seçilmeli; bu görevden kasten çıkarıldı çünkü ortada korunacak bir cookie oturumu yok.
