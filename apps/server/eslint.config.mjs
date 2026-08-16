// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // src/generated: Prisma'nin urettigi kod. Bizim yazmadigimiz ve her
    // "prisma generate"da ustune yazilan dosyalari lint'lemek anlamsiz.
    ignores: ['eslint.config.mjs', 'dist', 'src/generated'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // Brief Bolum 7: any ve non-null assertion yasak.
      '@typescript-eslint/no-explicit-any': 'error',
      // Not: bu kural "foo!.bar" ifadelerini yasaklar. DTO alanlarindaki
      // "email!: string" definite assignment assertion'dir, farkli bir sey
      // ve class-validator'in standart kullanimidir; kural onu engellemez.
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      // Her public metodun donus tipi explicit yazilsin (brief Bolum 7).
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
);
