export const PASSWORD_RULES = {
  // NIST 800-63B: uzunluk + ihlal kontrolu, kompozisyon kurali (buyuk harf +
  // rakam + sembol zorunlulugu) YOK. O kurallar kullaniciyi "Parola1!" gibi
  // tahmin edilebilir kaliplara itiyor ve gercek entropi kazandirmiyor.
  MIN_LENGTH: 12,
  // argon2'nin bcrypt gibi 72 byte siniri yok; ust sinir yalnizca DoS
  // (cok uzun girdiyi hashlemek) icin.
  MAX_LENGTH: 128,
  // Ad/soyad icerme kontrolu icin asgari uzunluk: "Ali" gibi kisa isimler
  // pek cok saglam parolanin icinde tesadufen gecer, yanlis pozitif olur.
  MIN_NAME_LENGTH_FOR_CONTAINMENT: 4,
} as const;
