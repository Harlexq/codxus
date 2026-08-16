import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { PASSWORD_RULES } from '@app/common/constants/password.constant';
import { REGEX } from '@app/common/constants/regex.constant';
import { Match } from '@app/common/decorators/match.decorator';
import { Trim, TrimLower } from '@app/common/decorators/transform.decorator';
import { JobTitle } from '@app/generated/prisma/enums';

export class CreateUserDto {
  @ApiProperty({ example: 'serhan@example.com', maxLength: 254 })
  // TrimLower: e-posta DB'ye her zaman normalize halde yazilir. citext
  // eklentisi yerine uygulama seviyesinde normalizasyon (Karar/Bolum 3).
  @TrimLower()
  @IsString({ message: i18nValidationMessage('validation.EMAIL_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.EMAIL_REQUIRED') })
  @IsEmail({}, { message: i18nValidationMessage('validation.EMAIL_INVALID') })
  @MaxLength(254, { message: i18nValidationMessage('validation.EMAIL_MAX') })
  email!: string;

  @ApiProperty({ example: 'Serhan', minLength: 2, maxLength: 64 })
  @Trim()
  @IsString({ message: i18nValidationMessage('validation.FIRST_NAME_STRING') })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.FIRST_NAME_REQUIRED'),
  })
  @MinLength(2, { message: i18nValidationMessage('validation.FIRST_NAME_MIN') })
  @MaxLength(64, {
    message: i18nValidationMessage('validation.FIRST_NAME_MAX'),
  })
  @Matches(REGEX.PERSON_NAME, {
    message: i18nValidationMessage('validation.FIRST_NAME_PATTERN'),
  })
  firstName!: string;

  @ApiProperty({ example: 'Bakır', minLength: 2, maxLength: 64 })
  @Trim()
  @IsString({ message: i18nValidationMessage('validation.LAST_NAME_STRING') })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.LAST_NAME_REQUIRED'),
  })
  @MinLength(2, { message: i18nValidationMessage('validation.LAST_NAME_MIN') })
  @MaxLength(64, { message: i18nValidationMessage('validation.LAST_NAME_MAX') })
  @Matches(REGEX.PERSON_NAME, {
    message: i18nValidationMessage('validation.LAST_NAME_PATTERN'),
  })
  lastName!: string;

  @ApiProperty({
    example: 'kirmizi-bisiklet-2026',
    minLength: PASSWORD_RULES.MIN_LENGTH,
    maxLength: PASSWORD_RULES.MAX_LENGTH,
  })
  // Sifre bilerek trim EDILMIYOR: bastaki/sondaki bosluk kullanicinin
  // tercihidir ve sessizce kirpmak girisi bozar.
  @IsString({ message: i18nValidationMessage('validation.PASSWORD_STRING') })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.PASSWORD_REQUIRED'),
  })
  @MinLength(PASSWORD_RULES.MIN_LENGTH, {
    message: i18nValidationMessage('validation.PASSWORD_MIN'),
  })
  @MaxLength(PASSWORD_RULES.MAX_LENGTH, {
    message: i18nValidationMessage('validation.PASSWORD_MAX'),
  })
  password!: string;

  @ApiProperty({ example: 'kirmizi-bisiklet-2026' })
  @IsString({
    message: i18nValidationMessage('validation.PASSWORD_CONFIRM_STRING'),
  })
  @IsNotEmpty({
    message: i18nValidationMessage('validation.PASSWORD_CONFIRM_REQUIRED'),
  })
  // DTO seviyesinde dogrulanir, DB'ye yazilmaz.
  @Match('password', {
    message: i18nValidationMessage('validation.PASSWORD_CONFIRM_MATCH'),
  })
  passwordConfirm!: string;

  @ApiPropertyOptional({
    enum: JobTitle,
    example: JobTitle.FOUNDER,
    description:
      'Meslek/unvan. Bir IZIN rolu DEGILDIR; yetkilendirme ileride ' +
      'sirket ve workspace uyeligi uzerinden yapilacak.',
  })
  @IsOptional()
  @IsEnum(JobTitle, {
    message: i18nValidationMessage('validation.JOB_TITLE_INVALID'),
  })
  jobTitle?: JobTitle;

  @ApiProperty({
    example: true,
    description:
      'Kullanim kosullari ve gizlilik metninin kabulu. Tek onay kutusu, ' +
      'iki kayit birden yazilir.',
  })
  @IsBoolean({
    message: i18nValidationMessage('validation.ACCEPT_TERMS_BOOLEAN'),
  })
  // Equals(true): alanin yalnizca var olmasi degil, TRUE olmasi gerekiyor.
  @Equals(true, {
    message: i18nValidationMessage('validation.ACCEPT_TERMS_REQUIRED'),
  })
  acceptTerms!: boolean;
}
