import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class VerifyEmailDto {
  @ApiProperty({
    example: 'sK3f9x2Qw8Zr1nTvB7yLmA4cE6hJ0pR5uX9dG2iN8oM',
    description:
      'Maildeki linkte gelen token. Query string yerine govdede alinir: ' +
      'query erisim loglarina ve Referer header ina duser.',
  })
  @IsString({ message: i18nValidationMessage('validation.TOKEN_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.TOKEN_REQUIRED') })
  // 32 byte base64url = 43 karakter. Ust sinir DoS'a karsi.
  @MinLength(20, { message: i18nValidationMessage('validation.TOKEN_INVALID') })
  @MaxLength(128, {
    message: i18nValidationMessage('validation.TOKEN_INVALID'),
  })
  token!: string;
}
