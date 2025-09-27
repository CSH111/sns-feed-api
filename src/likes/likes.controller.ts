import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('likes')
@Controller('posts/:postId/likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '좋아요 토글 (등록/취소)' })
  @ApiParam({ name: 'postId', description: '게시물 ID' })
  @ApiResponse({
    status: 201,
    description: '좋아요 상태가 변경되었습니다.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          examples: ['좋아요가 등록되었습니다.', '좋아요가 취소되었습니다.']
        },
        isLiked: { type: 'boolean', description: '현재 좋아요 상태' }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: '인증되지 않은 사용자',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' }
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
  async toggleLike(
    @Param('postId', ParseIntPipe) postId: number,
    @Request() req,
  ): Promise<{ message: string; isLiked: boolean }> {
    return this.likesService.toggleLike(postId, req.user.id);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '좋아요 상태 확인' })
  @ApiParam({ name: 'postId', description: '게시물 ID' })
  @ApiResponse({
    status: 200,
    description: '좋아요 상태 조회 성공',
    schema: {
      type: 'object',
      properties: {
        isLiked: { type: 'boolean', description: '좋아요 여부' }
      }
    }
  })
  async getLikeStatus(
    @Param('postId', ParseIntPipe) postId: number,
    @Request() req,
  ): Promise<{ isLiked: boolean }> {
    return this.likesService.getLikeStatus(postId, req.user.id);
  }
}