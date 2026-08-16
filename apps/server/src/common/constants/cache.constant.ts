export const CACHE_TTL = {
  PROFILE: 300,
  HIBP: 60 * 60,
  CSRF: 60 * 60,
  DEFAULT: 300,
} as const;

export const CACHE_KEYS = {
  PROFILE: (slug: string) => `profile:${slug}`,
  PROFILE_PREFIX: 'profile:',
  HIBP_PREFIX: 'hibp:',
} as const;
