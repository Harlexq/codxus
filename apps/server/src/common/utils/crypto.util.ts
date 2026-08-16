import { createHash, randomBytes } from 'crypto';

/**
 * Kriptografik olarak guvenli, URL'de encode gerektirmeyen token uretir.
 *
 * base64url (hex degil): 32 byte hex'te 64 karakter, base64url'de 43.
 * Daha kisa link, ayni entropi. Alfabesi [A-Za-z0-9_-] oldugu icin
 * query string'de kacis gerektirmez.
 */
export const generateToken = (bytes: number = 32): string =>
  randomBytes(bytes).toString('base64url');

/**
 * Token'in DB'de saklanacak hash'i.
 *
 * SHA-256 yeterli ve dogru tercih: token 256-bit rastgele, yani argon2
 * gibi yavas bir hash'in korudugu "zayif girdi" problemi burada yok.
 * Hizli olmasi ayrica tek sorguda findUnique yapmayi mumkun kiliyor.
 */
export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

/**
 * Bos string'i null'a cevirir. RequestContext IP/user-agent bulamadiginda
 * '' donuyor; DB'ye bos string yerine null yazmak dogru.
 */
export const emptyToNull = (value: string | undefined): string | null =>
  value === undefined || value.trim().length === 0 ? null : value;
