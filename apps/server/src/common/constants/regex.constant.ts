export const REGEX = {
  // \p{L}: Unicode harf sinifi. Turkce karakterleri (ğüşıöç) tek tek
  // saymaya gerek birakmiyor ve ileride eklenecek diller icin de calisiyor.
  // Aralarda tek bosluk, kesme isareti veya tire kabul edilir:
  // "Ayşe Nur", "O'Brien", "Ali-Rıza" gecerli.
  PERSON_NAME: /^\p{L}+(?:[ '-]\p{L}+)*$/u,
} as const;
