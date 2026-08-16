export const CACHE_TTL = {
  // HIBP yanitlari degismeye cok yavas; 1 saat cache disari giden istegi
  // ve gecikmeyi ciddi olcude dusuruyor.
  HIBP: 60 * 60,
} as const;

export const CACHE_KEYS = {
  HIBP_PREFIX: 'hibp:',
  hibpRange: (prefix: string): string => `hibp:${prefix}`,
} as const;
