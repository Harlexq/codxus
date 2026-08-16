import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

import { TrimLower } from '@app/common/decorators/transform.decorator';

export class ResendVerificationDto {
  @ApiProperty({ example: 'serhan@example.com', maxLength: 254 })
  @TrimLower()
  @IsString({ message: i18nValidationMessage('validation.EMAIL_STRING') })
  @IsNotEmpty({ message: i18nValidationMessage('validation.EMAIL_REQUIRED') })
  @IsEmail({}, { message: i18nValidationMessage('validation.EMAIL_INVALID') })
  @MaxLength(254, { message: i18nValidationMessage('validation.EMAIL_MAX') })
  email!: string;
}
