import { ApiProperty } from '@nestjs/swagger';

export class PostImageDto {
  @ApiProperty({ description: '이미지 ID' })
  id: number;

  @ApiProperty({ description: '이미지 URL' })
  url: string;

  @ApiProperty({ description: '이미지 순서' })
  order: number;
}

export class PostAuthorDto {
  @ApiProperty({ description: '작성자 ID' })
  id: number;

  @ApiProperty({ description: '작성자 닉네임' })
  nickname: string;

  @ApiProperty({ description: '프로필 이미지 URL', required: false })
  profileImageUrl?: string;
}

export class PostCategoryDto {
  @ApiProperty({ description: '카테고리 ID' })
  id: number;

  @ApiProperty({ description: '카테고리 이름' })
  name: string;
}

export class PostResponseDto {
  @ApiProperty({ description: '게시물 ID' })
  id: number;

  @ApiProperty({ description: '게시물 내용' })
  content: string;

  @ApiProperty({ description: '좋아요 수' })
  likesCount: number;

  @ApiProperty({ description: '리트윗 수' })
  retweetsCount: number;

  @ApiProperty({ description: '댓글 수' })
  commentsCount: number;

  @ApiProperty({ description: '작성일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시' })
  updatedAt: Date;

  @ApiProperty({ description: '작성자 정보', type: PostAuthorDto })
  user: PostAuthorDto;

  @ApiProperty({ description: '카테고리 정보', type: PostCategoryDto })
  category: PostCategoryDto;

  @ApiProperty({ description: '이미지 목록', type: [PostImageDto] })
  images: PostImageDto[];
}