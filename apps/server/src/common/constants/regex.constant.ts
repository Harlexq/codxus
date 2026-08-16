export const REGEX = {
  FIRTNAME: /^[a-zA-ZğüşıöçĞÜŞİÖÇ]{2,50}(\s[a-zA-ZğüşıöçĞÜŞİÖÇ]{2,50})*$/,
  LASTNAME: /^[a-zA-ZğüşıöçĞÜŞİÖÇ]{2,50}(\s[a-zA-ZğüşıöçĞÜŞİÖÇ]{2,50})*$/,
  PASSWORD: /^[\p{L}\p{N}\p{P}\p{S}]+$/u,
};
