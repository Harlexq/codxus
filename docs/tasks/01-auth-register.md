# Görev: Auth — Kayıt (Register) Akışı

> Bu dosya bir görev brief'idir. Uygulamadan önce **Bölüm 0**'ı oku.

---

## 0. Çalışma şekli (ÖNEMLİ)

1. Önce mevcut repo'yu incele (monorepo yapısı, varsa Nest app, prisma şeması, tsconfig, eslint).
2. Sonra **kod yazma** — `docs/tasks/01-auth-register.PLAN.md` üret. İçinde:
   - Önerilen klasör/dosya yapısı (mevcut yapı kötüyse gerekçeli değişiklik önerisi)
   - Prisma modelleri (alan alan, gerekçeli)
   - Endpoint listesi + request/response şekilleri
   - Kurulacak paket listesi + her biri **neden** gerekli
   - Belirsiz bıraktığım kararlar için 2-3 seçenek + senin önerin
3. Ben planı onaylayınca kodu yaz. Onaysız dosya taşıma, onaysız paket kurma.
4. Kodu tek seferde değil, mantıklı parçalar halinde yaz.
5. **Nest'te yeniyim.** Nest'e özgü kısımları (DI, decorator'lar, module scope, provider lifecycle) kısa yorum satırlarıyla açıkla. Genel TypeScript'i açıklamana gerek yok.
6. Frontend'e dokunma. Bu görev sadece backend.

---

## 1. Mevcut durum

<!-- BUNLARI DOLDUR — boş bırakırsan Claude tahmin eder ve yanlış kurar -->

- Monorepo aracı: `pnpm workspaces` / `Turborepo` / `Nx` → **?**
- Paket yöneticisi + sürüm: **?**
- Node sürümü: **?**
- Backend paketinin yolu: `packages/???`
- Nest app scaffold edilmiş mi, yoksa boş mu: **?**
- PostgreSQL lokalde nasıl çalışıyor (docker-compose var mı): **?**
- Redis var mı / kurabilir miyim: **?**
- SMTP: lokalde ne kullanacağım (Mailpit/Mailhog/Ethereal), prod'da ne: **?**
- Deploy hedefi (ileride önemli olacak): **?**

---

## 2. Kapsam

### Bu adımda YAPILACAK

- `POST /auth/users` — kayıt
- `POST /auth/email/verify` — e-posta doğrulama
- `POST /auth/email/resend` — doğrulama mailini tekrar gönder
- Prisma şeması: `User` + e-posta doğrulama token'ı (+ gerekiyorsa audit)
- Doğrulama e-postası gönderimi (MJML template, Türkçe)
- Global: `ValidationPipe`, exception filter, response envelope, request context (ip/ua), logger, rate limit, helmet, CORS
- i18n altyapısı (`nestjs-i18n`), şimdilik sadece `tr`
- Swagger dokümantasyonu
- `.env.example` + config validation (Joi veya zod — sen öner)

### Bu adımda YAPILMAYACAK (dosya bile açma)

- Login / session / refresh token / JWT guard → **bir sonraki görev**
- Şifre sıfırlama, şifre değiştirme, e-posta değiştirme
- 2FA, OAuth, magic link
- Company / Workspace / Project / Department / Task / Invite modelleri
- Dosya yükleme, S3, sharp, thumbnail
- Prometheus / Sentry / metrics
- Health check (login bittikten sonra)

> Kullanılmayan boş klasör açma. Klasörler ihtiyaç doğdukça oluşacak.
> Ama **ileriyi bozacak kararlar alma** — bir sonraki adımda session/JWT geleceğini bilerek tasarla.

---

## 3. Domain kararları (bunlar nettir, sorgulamadan uygula)

1. **"Rolünüz" alanı bir izin rolü DEĞİL, meslek/unvandır.** Alan adı `jobTitle`, nullable/opsiyonel.
   Enum: `DEVELOPER`, `DESIGNER`, `PROJECT_MANAGER`, `FREELANCER`, `FOUNDER`
2. **İzin/yetki sistemi ileride Company ve Workspace bazlı membership tablosunda olacak.**
   `User` üzerinde global bir `role` alanı TUTMA.
3. **Kayıt sırasında şirket oluşturulmaz.** Kullanıcı "Kurucu" seçse bile şirket oluşturma ayrı bir onboarding adımıdır (sonraki görev).
4. E-posta doğrulanmadan kullanıcı sisteme giriş yapamaz. `User.status` bunu yansıtsın.
5. E-posta sistemin birincil kimliğidir; `username` kavramı yok.

---

## 4. Frontend'in gönderdiği alanlar

```
firstName        zorunlu
lastName         zorunlu
email            zorunlu
password         zorunlu
passwordConfirm  zorunlu
jobTitle         opsiyonel (yukarıdaki enum)
```

`passwordConfirm` DTO seviyesinde doğrulansın, DB'ye yazılmasın.

---

## 5. Veri modeli beklentileri

Aşağıdakiler minimum; eksik gördüğün alanı gerekçesiyle öner.

**User**
- id (cuid/uuid — seçimini gerekçelendir)
- email (normalize edilmiş lowercase, unique; citext mi app-level normalize mi — öner)
- emailVerifiedAt (nullable)
- firstName, lastName
- passwordHash
- jobTitle (nullable enum)
- status (`PENDING_VERIFICATION` | `ACTIVE` | `SUSPENDED` | `DELETED`)
- locale (default `tr`)
- createdAt, updatedAt, deletedAt (soft delete)

**EmailVerificationToken**
- userId (relation)
- tokenHash — **ham token DB'ye yazılmaz**, sadece SHA-256 hash'i
- expiresAt, consumedAt (nullable)
- createdAt, requestIp, userAgent

İleride lazım olacağını düşündüğün ek tabloları (ör. AuditLog) **öner ama şimdi ekleme**.

---

## 6. Güvenlik gereksinimleri

- Şifre hash: `argon2id` tercih ediyorum; `bcrypt` öneriyorsan gerekçesini yaz.
- **User enumeration olmasın.** Zaten kayıtlı bir e-postayla kayıt denendiğinde davranış ne olmalı — `409` mü, generic `201` + "birisi hesabınızla kayıt olmaya çalıştı" maili mi? İki seçeneğin güvenlik/UX trade-off'unu yaz, kararı bana bırak.
- Doğrulama token'ı: `crypto.randomBytes(32)` → base64url. DB'de sadece hash. Karşılaştırma timing-safe.
- Token TTL: 24 saat. Tek kullanımlık (`consumedAt`). Yeni token istenince eskiler invalidate.
- Şifre politikası: min 12 karakter. HIBP (Pwned Passwords) k-anonymity kontrolü ekle — dış servis erişilemezse kayıt bloklanmasın (fail-open), logla.
- Rate limit: IP bazlı **ve** e-posta bazlı ayrı ayrı. Register 3/dk, resend 2/2dk.
- `passwordHash` hiçbir response'a sızmasın. Bunu `@Exclude` ile değil, **explicit response DTO + mapper** ile garanti et.
- Helmet, CORS whitelist (env'den), `X-Powered-By` kapalı.
- E-posta gönderimi request'i bloklamasın. Redis varsa BullMQ kuyruğu, yoksa `EventEmitter2` — hangisini önerdiğini yaz.

---

## 7. Kod konvansiyonları

- **Referans olarak paylaştığım eski `auth.controller.ts` sadece isimlendirme, Swagger dekoratörü ve response envelope konvansiyonu içindir. Kopyalama, oradaki endpoint'lerin çoğu bu kapsamda değil.**
- Standart response envelope kullan (referanstaki `ApiStandardResponse` mantığı).
- Hata mesajları hardcode string değil, **i18n key** üzerinden. Tüm anahtarlar `tr` dosyasında.
- TypeScript strict + `noUncheckedIndexedAccess`. `any` ve `!` (non-null assertion) yasak.
- Prisma tipleri controller katmanına sızmasın; service→controller arası kendi tiplerin/DTO'ların olsun.
- Path alias kullan (`@app/...` gibi), relative `../../..` yok.
- Her public metodun dönüş tipi explicit yazılsın.

---

## 8. Paketler

`package.json`'ı başka bir projeden aldım, **birebir eşleşme aranmıyor**. Sadece bu görev için gerekenleri kur.
Kurmadan önce listeyi + gerekçeyi bana göster. Sürümleri repo'daki Node/Nest sürümüyle uyumlu seç.

---

## 9. Teslim

Bittiğinde ayrıca şunları ver:

- `.env.example` (tüm değişkenler açıklamalı)
- Akışı uçtan uca test edebileceğim `curl` komutları (kayıt → maildeki token → doğrulama)
- Kayıt ve doğrulama servisleri için birer unit test örneği (hepsini yazma, ben devam edeceğim)
- Bir sonraki adımda (login/session) neyin hazır, neyin eksik olduğuna dair 5 maddelik not