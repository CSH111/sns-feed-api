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
import { RetweetsService } from './retweets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('retweets')
@Controller('posts/:postId/retweets')
export class RetweetsController {
  constructor(private readonly retweetsService: RetweetsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '리트윗 토글 (등록/취소)' })
  @ApiParam({ name: 'postId', description: '게시물 ID' })
  @ApiResponse({
    status: 201,
    description: '리트윗 상태가 변경되었습니다.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          examples: ['리트윗이 등록되었습니다.', '리트윗이 취소되었습니다.']
        },
        isRetweeted: { type: 'boolean', description: '현재 리트윗 상태' }
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
  async toggleRetweet(
    @Param('postId', ParseIntPipe) postId: number,
    @Request() req,
  ): Promise<{ message: string; isRetweeted: boolean }> {
    return this.retweetsService.toggleRetweet(postId, req.user.id);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '리트윗 상태 확인' })
  @ApiParam({ name: 'postId', description: '게시물 ID' })
  @ApiResponse({
    status: 200,
    description: '리트윗 상태 조회 성공',
    schema: {
      type: 'object',
      properties: {
        isRetweeted: { type: 'boolean', description: '리트윗 여부' }
      }
    }
  })
  async getRetweetStatus(
    @Param('postId', ParseIntPipe) postId: number,
    @Request() req,
  ): Promise<{ isRetweeted: boolean }> {
    return this.retweetsService.getRetweetStatus(postId, req.user.id);
  }
}