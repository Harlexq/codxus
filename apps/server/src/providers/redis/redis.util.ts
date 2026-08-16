export interface RedisConnectionOptions {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db: number;
}

/**
 * REDIS_URL'i BullMQ'nun bekledigi ayrik alanlara cevirir.
 *
 * ioredis URL'i dogrudan kabul ediyor ama BullMQ'nun connection secenegi
 * host/port/password bekliyor; tek bir env degiskeni tutup ihtiyaci olana
 * burada donusturuyoruz.
 */
export const parseRedisUrl = (redisUrl: string): RedisConnectionOptions => {
  const url = new URL(redisUrl);
  const database = Number(url.pathname.replace('/', ''));

  return {
    host: url.hostname,
    port: url.port.length > 0 ? Number(url.port) : 6379,
    username: url.username.length > 0 ? url.username : undefined,
    password: url.password.length > 0 ? url.password : undefined,
    db: Number.isInteger(database) ? database : 0,
  };
};
