import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: '로그인 ID',
    example: 'user123',
  })
  @IsString()
  loginId: string;

  @ApiProperty({
    description: '비밀번호',
    example: 'password123!',
  })
  @IsString()
  password: string;

  @ApiProperty({
    description: '기기 ID (선택사항)',
    example: 'device-12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  deviceId?: string;
}