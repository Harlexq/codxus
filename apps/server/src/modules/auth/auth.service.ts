import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { generateToken } from 'src/common/utils/crypto.util';

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}

  generateCsrfToken(res: Response): { csrfToken: string } {
    const token = generateToken();
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    res.cookie('csrf-token', token, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: this.configService.get<number>('cookie.maxAge') ?? 60 * 60 * 1000,
    });

    return { csrfToken: token };
  }
}
