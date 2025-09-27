import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsArray, IsUrl, MaxLength, MinLength, ArrayMaxSize, IsOptional } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    description: '게시물 내용',
    example: '오늘 만든 파스타가 정말 맛있었어요! 🍝',
    minLength: 1,
    maxLength: 280,
  })
  @IsString()
  @MinLength(1, { message: '게시물 내용을 입력해주세요.' })
  @MaxLength(280, { message: '게시물 내용은 최대 280자까지 입력 가능합니다.' })
  content: string;

  @ApiProperty({
    description: '카테고리 ID',
    example: 1,
  })
  @IsInt()
  categoryId: number;

  @ApiProperty({
    description: '이미지 URL 배열 (최대 4개)',
    example: [
      'https://picsum.photos/500/300?random=1',
      'https://picsum.photos/500/300?random=2'
    ],
    required: false,
    maxItems: 4,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4, { message: '이미지는 최대 4개까지 등록 가능합니다.' })
  @IsUrl({}, { each: true, message: '올바른 URL 형식이어야 합니다.' })
  imageUrls?: string[];
}