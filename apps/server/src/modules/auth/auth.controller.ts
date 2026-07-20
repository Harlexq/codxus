import { Controller, Get, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiStandardResponse } from 'src/core/swagger/api-standard-response.decorator';
import { AuthResponseDto } from './dto/response/auth-response.dto';
import { type Response } from 'express';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('csrf')
  @ApiOperation({ summary: 'CSRF token al' })
  @ApiStandardResponse(AuthResponseDto, {
    description: 'CSRF token başarıyla oluşturuldu',
  })
  getCsrfToken(@Res({ passthrough: true }) res: Response) {
    return this.authService.generateCsrfToken(res);
  }
}
