import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import appConfig from '@app/config/app.config';
import securityConfig from '@app/config/security.config';
import { PrismaModule } from '@app/database/prisma.module';
import { HibpModule } from '@app/providers/hibp/hibp.module';
import { MailModule } from '@app/providers/mail/mail.module';

import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password/password.service';
import { EmailVerificationTokenService } from './token/email-verification-token.service';

@Module({
  imports: [
    ConfigModule.forFeature(appConfig),
    ConfigModule.forFeature(securityConfig),
    PrismaModule,
    UserModule,
    // MailModule yalnizca MailProducer'i disariya aciyor; AuthService
    // SMTP'ye erisemiyor, sadece kuyruga is birakabiliyor.
    MailModule,
    HibpModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordService, EmailVerificationTokenService],
  exports: [AuthService],
})
export class AuthModule {}
