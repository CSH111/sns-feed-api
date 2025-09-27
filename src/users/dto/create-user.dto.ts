import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, Matches, Length } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'ID (영문소문자, 숫자만 허용)',
    example: 'user123',
    pattern: '^[a-z0-9]+$',
    minLength: 3,
    maxLength: 20,
  })
  @IsString()
  @Length(3, 20, { message: 'ID는 3-20자 사이여야 합니다' })
  @Matches(/^[a-z0-9]+$/, { message: 'ID는 영문소문자와 숫자만 허용됩니다' })
  loginId: string;

  @ApiProperty({
    description: '이름 (한글, 영문대소문자 허용)',
    example: '김철수',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @Length(2, 50, { message: '이름은 2-50자 사이여야 합니다' })
  @Matches(/^[가-힣a-zA-Z\s]+$/, { message: '이름은 한글, 영문대소문자만 허용됩니다' })
  name: string;

  @ApiProperty({
    description: '닉네임 (영문소문자만 허용, 중복 불허)',
    example: 'nickname',
    pattern: '^[a-z]+$',
    minLength: 2,
    maxLength: 20,
  })
  @IsString()
  @Length(2, 20, { message: '닉네임은 2-20자 사이여야 합니다' })
  @Matches(/^[a-z]+$/, { message: '닉네임은 영문소문자만 허용됩니다' })
  nickname: string;

  @ApiProperty({
    description: '비밀번호 (영문소문자, 숫자, 특수문자 1개 이상 포함)',
    example: 'password123!',
    minLength: 8,
    maxLength: 20,
  })
  @IsString()
  @Length(8, 20, { message: '비밀번호는 8-20자 사이여야 합니다' })
  @Matches(/^(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).*$/, {
    message: '비밀번호는 영문소문자, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다',
  })
  password: string;

  @ApiProperty({
    description: '프로필 이미지 URL (선택사항)',
    example: 'https://picsum.photos/40/40?random=1',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: '올바른 URL 형식이어야 합니다' })
  profileImageUrl?: string;
}