import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentResponseDto } from './dto/comment-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('comments')
@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '댓글 작성' })
  @ApiParam({ name: 'postId', description: '게시물 ID' })
  @ApiResponse({
    status: 201,
    description: '댓글이 성공적으로 작성되었습니다.',
    type: CommentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청',
    content: {
      'application/json': {
        examples: {
          emptyContent: {
            summary: '빈 댓글 내용',
            value: {
              statusCode: 400,
              message: '댓글 내용을 입력해주세요.',
              error: 'Bad Request'
            }
          },
          tooLong: {
            summary: '댓글 길이 초과',
            value: {
              statusCode: 400,
              message: '댓글은 최대 500자까지 입력 가능합니다.',
              error: 'Bad Request'
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: '게시물을 찾을 수 없음',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: '게시물을 찾을 수 없습니다.' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  async create(
    @Param('postId', ParseIntPipe) postId: number,
    @Request() req,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.commentsService.create(postId, req.user.id, createCommentDto);
  }

  @Get()
  @ApiOperation({ summary: '댓글 목록 조회' })
  @ApiParam({ name: 'postId', description: '게시물 ID' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: '페이지 번호 (기본값: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '페이지당 댓글 수 (기본값: 20)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: '댓글 목록 조회 성공',
    schema: {
      type: 'object',
      properties: {
        comments: {
          type: 'array',
          items: { $ref: '#/components/schemas/CommentResponseDto' },
        },
        total: { type: 'number', description: '전체 댓글 수' },
        page: { type: 'number', description: '현재 페이지' },
        limit: { type: 'number', description: '페이지당 댓글 수' },
      },
    },
  })
  async findByPost(
    @Param('postId', ParseIntPipe) postId: number,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.commentsService.findByPost(postId, page, limit);
  }

  @Put(':commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '댓글 수정' })
  @ApiParam({ name: 'postId', description: '게시물 ID' })
  @ApiParam({ name: 'commentId', description: '댓글 ID' })
  @ApiResponse({
    status: 200,
    description: '댓글이 성공적으로 수정되었습니다.',
    type: CommentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '잘못된 요청',
    content: {
      'application/json': {
        examples: {
          emptyContent: {
            summary: '빈 댓글 내용',
            value: {
              statusCode: 400,
              message: '댓글 내용을 입력해주세요.',
              error: 'Bad Request'
            }
          },
          tooLong: {
            summary: '댓글 길이 초과',
            value: {
              statusCode: 400,
              message: '댓글은 최대 500자까지 입력 가능합니다.',
              error: 'Bad Request'
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: '댓글을 수정할 권한이 없습니다.' },
        error: { type: 'string', example: 'Forbidden' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: '댓글을 찾을 수 없음',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: '댓글을 찾을 수 없습니다.' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  async update(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Request() req,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.commentsService.update(commentId, req.user.id, updateCommentDto);
  }

  @Delete(':commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '댓글 삭제' })
  @ApiParam({ name: 'postId', description: '게시물 ID' })
  @ApiParam({ name: 'commentId', description: '댓글 ID' })
  @ApiResponse({
    status: 200,
    description: '댓글이 성공적으로 삭제되었습니다.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: '댓글이 성공적으로 삭제되었습니다.' }
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: '권한 없음',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: '댓글을 삭제할 권한이 없습니다.' },
        error: { type: 'string', example: 'Forbidden' }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: '댓글을 찾을 수 없음',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: '댓글을 찾을 수 없습니다.' },
        error: { type: 'string', example: 'Not Found' }
      }
    }
  })
  async remove(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Request() req,
  ): Promise<{ message: string }> {
    return this.commentsService.remove(commentId, req.user.id);
  }
}