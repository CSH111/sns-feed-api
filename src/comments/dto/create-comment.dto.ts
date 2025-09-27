import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    description: '댓글 내용',
    example: '정말 좋은 글이네요! 👍',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500, { message: '댓글은 최대 500자까지 입력 가능합니다.' })
  content: string;
}