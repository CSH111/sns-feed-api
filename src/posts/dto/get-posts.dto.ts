import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, IsIn, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetPostsDto {
  @ApiProperty({
    description: '마지막으로 조회한 게시물 ID (커서)',
    example: 123,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  cursor?: number;

  @ApiProperty({
    description: '조회할 게시물 수 (기본값: 10)',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({
    description: '카테고리 ID로 필터링',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  categoryId?: number;

  @ApiProperty({
    description: '정렬 기준 (latest: 최신순, oldest: 오래된순)',
    enum: ['latest', 'oldest'],
    example: 'latest',
    required: false,
  })
  @IsOptional()
  @IsIn(['latest', 'oldest'])
  sortBy?: 'latest' | 'oldest' = 'latest';
}

export class PostsWithCursorDto {
  @ApiProperty({
    description: '게시물 목록',
    type: 'array',
    items: { $ref: '#/components/schemas/PostResponseDto' },
  })
  posts: any[];

  @ApiProperty({
    description: '다음 페이지를 위한 커서 (마지막 게시물 ID)',
    example: 115,
    required: false,
  })
  nextCursor?: number;

  @ApiProperty({
    description: '다음 페이지 존재 여부',
    example: true,
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: '조회된 게시물 수',
    example: 10,
  })
  count: number;
}