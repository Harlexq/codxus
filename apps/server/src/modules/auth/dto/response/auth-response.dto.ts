import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token for authentication',
    example: '1b432425536f038eeeecd4055f9564ccafa62ffe1b74b18c7e948494c5ed0343',
  })
  accessToken!: string;
}
