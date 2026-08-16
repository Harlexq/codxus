import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

// import type: isolatedModules + emitDecoratorMetadata acikken dekoratorlu
// imzada gecen tipler deger olarak import edilemez (TS1272).
import type { RequestContext } from '@app/common/context/request-context.interface';
import { ReqContext } from '@app/common/decorators/req-context.decorator';
import {
  ApiStandardEmptyResponse,
  ApiStandardResponse,
} from '@app/core/swagger/api-standard-response.decorator';

import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { RegisterResponseDto } from './dto/response/register-response.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

const ONE_MINUTE = 60_000;

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  // Iki boyut ayri sayilir: 'ip' ve 'email' isimli throttler'lar
  // AppModule'de farkli tracker'larla tanimli. E-posta limiti saatlik,
  // cunku IP degistirmek kolay ama hedef e-posta sabittir.
  @Throttle({
    ip: { limit: 3, ttl: ONE_MINUTE },
    email: { limit: 3, ttl: 60 * ONE_MINUTE },
  })
  @ApiOperation({
    summary: 'Kayıt ol',
    description:
      'E-posta yeni de olsa zaten kayıtlı da olsa AYNI 201 yanıtı döner. ' +
      'Kayıtlı bir adres denendiğinde kullanıcı durumdan e-posta ile ' +
      'haberdar edilir. Amaç: user enumeration engellemek.',
  })
  @ApiStandardResponse(RegisterResponseDto, {
    status: 201,
    description: 'İstek alındı, e-posta doğrulaması bekleniyor',
  })
  @ApiResponse({
    status: 400,
    description: 'Validasyon veya şifre politikası hatası',
  })
  @ApiResponse({ status: 429, description: 'Çok fazla istek' })
  async createUser(
    @Body() body: CreateUserDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<RegisterResponseDto> {
    return this.authService.register(body, ctx);
  }

  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  // Bu endpoint'te govdede e-posta yok; 'email' throttler'i skipIf ile
  // kendiliginden atlanir.
  @Throttle({ ip: { limit: 10, ttl: ONE_MINUTE } })
  @ApiOperation({
    summary: 'E-posta doğrula',
    description:
      'Token gövdede alınır, query string’de değil: query erişim ' +
      'loglarına ve Referer header’ına düşer.',
  })
  @ApiStandardEmptyResponse({ description: 'E-posta doğrulandı' })
  @ApiResponse({
    status: 400,
    description: 'Token geçersiz, süresi dolmuş veya daha önce kullanılmış',
  })
  @ApiResponse({ status: 429, description: 'Çok fazla istek' })
  async verifyEmail(@Body() body: VerifyEmailDto): Promise<void> {
    await this.authService.verifyEmail(body);
  }

  @Post('email/resend')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    ip: { limit: 2, ttl: 2 * ONE_MINUTE },
    email: { limit: 2, ttl: 2 * ONE_MINUTE },
  })
  @ApiOperation({
    summary: 'Doğrulama e-postasını yeniden gönder',
    description:
      'Kullanıcı bulunamasa da, e-posta zaten doğrulanmış olsa da, ' +
      'cooldown dolmamış olsa da aynı boş yanıt döner.',
  })
  @ApiStandardEmptyResponse({ description: 'İstek alındı' })
  @ApiResponse({ status: 429, description: 'Çok fazla istek' })
  async resendVerification(
    @Body() body: ResendVerificationDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<void> {
    await this.authService.resendVerification(body, ctx);
  }
}
