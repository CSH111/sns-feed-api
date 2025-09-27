import { ApiProperty } from '@nestjs/swagger';

export class CommentAuthorDto {
  @ApiProperty({ description: '작성자 ID' })
  id: number;

  @ApiProperty({ description: '작성자 닉네임' })
  nickname: string;

  @ApiProperty({ description: '프로필 이미지 URL', required: false })
  profileImageUrl?: string;
}

export class CommentResponseDto {
  @ApiProperty({ description: '댓글 ID' })
  id: number;

  @ApiProperty({ description: '댓글 내용' })
  content: string;

  @ApiProperty({ description: '작성일시' })
  createdAt: Date;

  @ApiProperty({ description: '수정일시' })
  updatedAt: Date;

  @ApiProperty({ description: '작성자 정보', type: CommentAuthorDto })
  user: CommentAuthorDto;
}