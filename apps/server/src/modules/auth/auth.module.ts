import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  exports: [],
  imports: [],
  providers: [AuthService],
})
export class AuthModule {}
