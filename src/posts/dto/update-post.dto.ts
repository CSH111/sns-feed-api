import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, MaxLength, MinLength, IsOptional } from 'class-validator';

export class UpdatePostDto {
  @ApiProperty({
    description: '수정할 게시물 내용',
    example: '수정된 게시물 내용입니다! 🎉',
    minLength: 1,
    maxLength: 280,
  })
  @IsString()
  @MinLength(1, { message: '게시물 내용을 입력해주세요.' })
  @MaxLength(280, { message: '게시물 내용은 최대 280자까지 입력 가능합니다.' })
  content: string;

  @ApiProperty({
    description: '수정할 카테고리 ID',
    example: 2,
    required: false,
  })
  @IsOptional()
  @IsInt()
  categoryId?: number;
}