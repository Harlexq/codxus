// DI token'i. Provider'i bir sinif degil de harici bir kutuphane nesnesi
// (ioredis client'i) oldugu icin sinif adiyla enjekte edemiyoruz; Nest'te
// bu durumda Symbol veya string token kullanilir ve @Inject(...) ile alinir.
export const REDIS_CLIENT = Symbol('REDIS_CLIENT');
